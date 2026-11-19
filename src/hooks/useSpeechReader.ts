import { useCallback, useEffect, useRef, useState } from 'react';

function splitIntoChunks(text: string, maxLen = 220): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];

  const sentences = clean.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) || [clean];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((current + ' ' + trimmed).trim().length <= maxLen) {
      current = (current + ' ' + trimmed).trim();
    } else {
      if (current) chunks.push(current);
      if (trimmed.length <= maxLen) {
        current = trimmed;
      } else {
        // Hard-wrap very long sentences by word boundary
        const words = trimmed.split(' ');
        let sub = '';
        for (const w of words) {
          if ((sub + ' ' + w).trim().length <= maxLen) {
            sub = (sub + ' ' + w).trim();
          } else {
            if (sub) chunks.push(sub);
            sub = w;
          }
        }
        current = sub;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

export function useSpeechReader(title: string, plainText: string, lang?: string | null) {
  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const cancelledRef = useRef(false);
  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  const stop = useCallback(() => {
    cancelledRef.current = true;
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsPaused(false);
    indexRef.current = 0;
  }, [isSupported]);

  const speakChunk = useCallback(
    (idx: number) => {
      if (!isSupported || cancelledRef.current) return;
      const chunks = chunksRef.current;
      if (idx >= chunks.length) {
        setIsSpeaking(false);
        setIsPaused(false);
        indexRef.current = 0;
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunks[idx]);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      if (lang) {
        utterance.lang = lang;
      }

      utterance.onend = () => {
        if (cancelledRef.current) return;
        indexRef.current = idx + 1;
        speakChunk(idx + 1);
      };

      utterance.onerror = () => {
        if (cancelledRef.current) return;
        setIsSpeaking(false);
        setIsPaused(false);
      };

      window.speechSynthesis.speak(utterance);
    },
    [isSupported]
  );

  const start = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    cancelledRef.current = false;

    const fullText = [title, plainText].filter(Boolean).join('. ');
    const chunks = splitIntoChunks(fullText);
    if (chunks.length === 0) return;

    chunksRef.current = chunks;
    indexRef.current = 0;
    setIsSpeaking(true);
    setIsPaused(false);
    speakChunk(0);
  }, [isSupported, plainText, speakChunk, title]);

  const togglePlayPause = useCallback(() => {
    if (!isSupported) return;
    if (!isSpeaking) {
      start();
      return;
    }
    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    } else {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isPaused, isSpeaking, isSupported, start]);

  // Stop speech when article changes or component unmounts
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported, title, plainText]);

  return {
    isSupported,
    isSpeaking,
    isPaused,
    start,
    stop,
    togglePlayPause,
  };
}
