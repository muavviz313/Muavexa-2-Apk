// In-memory session map for current UI translation speed (does not persist across reloads)
const sessionTranslationMap = new Map<string, string>();

let gtxCooldownUntil = 0;

function splitTextForTranslation(text: string, maxLen = 420): string[] {
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= maxLen) return [clean];

  const sentences = clean.match(/[^.!?؟۔\n]+[.!?؟۔\n]*\s*/g) || [clean];
  const chunks: string[] = [];
  let buffer = '';

  for (const sentence of sentences) {
    if ((buffer + sentence).length <= maxLen) {
      buffer += sentence;
    } else {
      if (buffer.trim()) chunks.push(buffer.trim());
      if (sentence.length <= maxLen) {
        buffer = sentence;
      } else {
        const words = sentence.split(/\s+/);
        let wordBuf = '';
        for (const w of words) {
          if ((wordBuf ? `${wordBuf} ${w}` : w).length <= maxLen) {
            wordBuf = wordBuf ? `${wordBuf} ${w}` : w;
          } else {
            if (wordBuf) chunks.push(wordBuf);
            wordBuf = w;
          }
        }
        buffer = wordBuf;
      }
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks;
}

async function translateViaGoogleGtx(
  text: string,
  targetLang: string,
  signal?: AbortSignal
): Promise<string | null> {
  if (Date.now() < gtxCooldownUntil) return null;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, { signal });
    if (res.status === 429 || !res.ok) {
      if (res.status === 429) {
        gtxCooldownUntil = Date.now() + 5 * 60 * 1000;
      }
      return null;
    }
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const translated = (data[0] as unknown[])
      .map((part) => (Array.isArray(part) && typeof part[0] === 'string' ? part[0] : ''))
      .join('');
    return translated.trim() || null;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return null;
  }
}

async function translateViaMyMemory(
  text: string,
  targetLang: string,
  signal?: AbortSignal
): Promise<string | null> {
  const tryPair = async (source: string): Promise<string | null> => {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=${encodeURIComponent(source)}|${encodeURIComponent(targetLang)}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      responseStatus?: number;
      responseData?: { translatedText?: string };
    };
    if (data.responseStatus !== 200) return null;
    const translated = data.responseData?.translatedText;
    if (!translated || translated.startsWith('MYMEMORY WARNING')) return null;
    return translated;
  };

  try {
    const autoResult = await tryPair('autodetect');
    if (autoResult) return autoResult;
    return await tryPair('en');
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    return null;
  }
}

async function translateChunk(
  chunk: string,
  targetLang: string,
  signal?: AbortSignal
): Promise<string> {
  const trimmed = chunk.trim();
  if (!trimmed) return chunk;

  const cacheKey = `${targetLang}::${trimmed}`;
  const cached = sessionTranslationMap.get(cacheKey);
  if (cached) return cached;

  const gtx = await translateViaGoogleGtx(trimmed, targetLang, signal);
  if (gtx) {
    sessionTranslationMap.set(cacheKey, gtx);
    return gtx;
  }

  const mm = await translateViaMyMemory(trimmed, targetLang, signal);
  if (mm) {
    sessionTranslationMap.set(cacheKey, mm);
    return mm;
  }

  throw new Error('Translation service is temporarily unavailable. Please try again.');
}

export async function translateText(
  text: string,
  targetLang: string,
  signal?: AbortSignal
): Promise<string> {
  if (!text || !text.trim() || !targetLang) return text;

  const chunks = splitTextForTranslation(text, 420);
  if (chunks.length === 0) return text;

  const results: string[] = [];
  for (const chunk of chunks) {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }
    const translated = await translateChunk(chunk, targetLang, signal);
    results.push(translated);
  }
  return results.join(' ');
}

export async function translateManyTexts(
  texts: string[],
  targetLang: string,
  signal?: AbortSignal,
  concurrency = 4
): Promise<string[]> {
  if (!targetLang || texts.length === 0) return texts;

  const output = new Array<string>(texts.length);
  let cursor = 0;

  const worker = async () => {
    while (cursor < texts.length) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }
      const idx = cursor++;
      const item = texts[idx];
      if (!item || !item.trim()) {
        output[idx] = item;
        continue;
      }
      output[idx] = await translateText(item, targetLang, signal);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, texts.length) }, () =>
    worker()
  );
  await Promise.all(workers);
  return output;
}

/**
 * Safely translates all readable text nodes inside sanitized article HTML
 * without mutating code blocks or breaking React DOM reconciliation.
 */
export async function translateSanitizedHtml(
  sanitizedHtml: string,
  targetLang: string,
  signal?: AbortSignal
): Promise<{ translatedHtml: string; translatedPlainText: string }> {
  if (!sanitizedHtml || !targetLang) {
    return { translatedHtml: sanitizedHtml, translatedPlainText: '' };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(sanitizedHtml, 'text/html');

  const textNodes: Text[] = [];
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const val = node.nodeValue || '';
      if (!val.trim()) return NodeFilter.FILTER_REJECT;

      let parent = node.parentElement;
      while (parent) {
        const tag = parent.tagName.toLowerCase();
        if (tag === 'pre' || tag === 'code' || tag === 'script' || tag === 'style') {
          return NodeFilter.FILTER_REJECT;
        }
        parent = parent.parentElement;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let currentNode = walker.nextNode();
  while (currentNode) {
    textNodes.push(currentNode as Text);
    currentNode = walker.nextNode();
  }

  const originals = textNodes.map((n) => n.nodeValue || '');
  const translatedList = await translateManyTexts(originals, targetLang, signal, 4);

  textNodes.forEach((node, idx) => {
    const orig = originals[idx];
    const leadSpace = orig.match(/^\s*/)?.[0] || '';
    const trailSpace = orig.match(/\s*$/)?.[0] || '';
    node.nodeValue = `${leadSpace}${translatedList[idx].trim()}${trailSpace}`;
  });

  const translatedPlainText = (doc.body.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    translatedHtml: doc.body.innerHTML,
    translatedPlainText,
  };
}
