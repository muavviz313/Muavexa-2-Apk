import { BlogPost, CategoryInfo, FeedResponse } from '../types/blog';

const BLOG_BASE = 'https://muavexa.blogspot.com';

interface BloggerTextNode {
  $t?: string;
}

interface BloggerLinkNode {
  rel?: string;
  type?: string;
  href?: string;
}

interface BloggerCategoryNode {
  term?: string;
}

interface BloggerAuthorNode {
  name?: BloggerTextNode;
}

interface BloggerEntryRaw {
  id?: BloggerTextNode;
  title?: BloggerTextNode;
  published?: BloggerTextNode;
  updated?: BloggerTextNode;
  content?: BloggerTextNode;
  summary?: BloggerTextNode;
  link?: BloggerLinkNode[];
  category?: BloggerCategoryNode[];
  author?: BloggerAuthorNode[];
  media$thumbnail?: {
    url?: string;
  };
}

interface BloggerFeedRaw {
  feed?: {
    openSearch$totalResults?: BloggerTextNode;
    category?: BloggerCategoryNode[];
    entry?: BloggerEntryRaw[];
  };
  entry?: BloggerEntryRaw;
}

const ALLOWED_IFRAME_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'player.vimeo.com',
  'www.blogger.com',
  'draft.blogger.com',
  'open.spotify.com',
  'w.soundcloud.com',
  'codepen.io',
  'player.twitch.tv',
];

function isAllowedIframeSrc(src: string): boolean {
  try {
    const parsed = new URL(src, BLOG_BASE);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_IFRAME_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export function upgradeBloggerImageUrl(url: string): string {
  if (!url) return url;
  const trimmed = url.trim();
  const normalized = trimmed.startsWith('http://')
    ? trimmed.replace('http://', 'https://')
    : trimmed;

  if (normalized.includes('blogspot.com') || normalized.includes('googleusercontent.com')) {
    // Only upgrade cropped/small Blogger sizes (e.g. /s72-c/, /s320/, /w400-h300/)
    let upgraded = normalized.replace(
      /\/(s(?:[1-9]\d{0,2}|[1-5]\d{2})(?:-[a-z0-9-]+)?|s\d+-[a-z0-9-]+|w\d+-h\d+(?:-[a-z0-9-]+)?)\//gi,
      '/s1200/'
    );
    upgraded = upgraded.replace(
      /=(s(?:[1-9]\d{0,2}|[1-5]\d{2})(?:-[a-z0-9-]+)?|s\d+-[a-z0-9-]+|w\d+-h\d+(?:-[a-z0-9-]+)?)$/i,
      '=s1200'
    );
    return upgraded;
  }
  return normalized;
}

function extractNumericPostId(idString: string): string | null {
  const match = idString.match(/post-(\d+)/);
  return match ? match[1] : null;
}

function formatPublishDate(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function sanitizeAndExtractContent(rawHtml: string): {
  sanitizedHtml: string;
  plainText: string;
  firstImageUrl: string | null;
} {
  if (!rawHtml) {
    return { sanitizedHtml: '', plainText: '', firstImageUrl: null };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Remove unsafe or non-content tags
  const blockedTags = [
    'script',
    'style',
    'noscript',
    'object',
    'embed',
    'applet',
    'form',
    'input',
    'textarea',
    'select',
    'button',
    'link',
    'meta',
    'base',
  ];
  blockedTags.forEach((tag) => {
    doc.body.querySelectorAll(tag).forEach((el) => el.remove());
  });

  let firstImageUrl: string | null = null;

  // Inspect every element for security & mobile responsiveness
  const allElements = Array.from(doc.body.querySelectorAll('*'));
  for (const el of allElements) {
    // Strip inline event handlers & restrictive inline dimensions/colors
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();

      if (name.startsWith('on')) {
        el.removeAttribute(attr.name);
        continue;
      }

      if (
        name === 'style' ||
        name === 'width' ||
        name === 'height' ||
        name === 'bgcolor' ||
        name === 'color' ||
        name === 'face' ||
        name === 'size' ||
        name === 'align'
      ) {
        // Preserve iframe width/height removal since wrapper handles 16:9
        el.removeAttribute(attr.name);
        continue;
      }

      if ((name === 'href' || name === 'src') && /^javascript:/i.test(value)) {
        el.removeAttribute(attr.name);
      }
    }

    const tag = el.tagName.toLowerCase();

    if (tag === 'a') {
      const href = el.getAttribute('href') || '';
      if (href && !href.startsWith('#')) {
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    }

    if (tag === 'img') {
      const src = el.getAttribute('src') || el.getAttribute('data-src') || '';
      if (!src || src.startsWith('data:text')) {
        el.remove();
        continue;
      }
      const upgraded = upgradeBloggerImageUrl(src);
      el.setAttribute('src', upgraded);
      el.setAttribute('referrerpolicy', 'no-referrer');
      el.setAttribute('loading', 'eager');
      if (!el.getAttribute('alt')) {
        el.setAttribute('alt', 'Article illustration');
      }

      // Skip obvious 1x1 tracking pixels
      const isTinyPixel = /1x1|pixel|spacer|blank\.gif/i.test(upgraded);
      if (!firstImageUrl && !isTinyPixel) {
        firstImageUrl = upgraded;
      }
    }

    if (tag === 'iframe') {
      const src = el.getAttribute('src') || '';
      if (!isAllowedIframeSrc(src)) {
        el.remove();
        continue;
      }
      if (!el.parentElement?.classList.contains('muavexa-embed-wrap')) {
        const wrapper = doc.createElement('div');
        wrapper.className = 'muavexa-embed-wrap';
        el.parentNode?.insertBefore(wrapper, el);
        wrapper.appendChild(el);
      }
    }

    if (tag === 'table') {
      if (!el.parentElement?.classList.contains('muavexa-table-wrap')) {
        const wrapper = doc.createElement('div');
        wrapper.className = 'muavexa-table-wrap';
        el.parentNode?.insertBefore(wrapper, el);
        wrapper.appendChild(el);
      }
    }
  }

  // Collapse empty paragraphs or redundant whitespace nodes
  doc.body.querySelectorAll('p, div, span').forEach((el) => {
    if (
      el.children.length === 0 &&
      (el.textContent || '').replace(/\u00a0/g, ' ').trim() === ''
    ) {
      el.remove();
    }
  });

  const plainText = (doc.body.textContent || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    sanitizedHtml: doc.body.innerHTML,
    plainText,
    firstImageUrl,
  };
}

function parseEntry(entry: BloggerEntryRaw): BlogPost {
  const id = entry.id?.$t || `post-${Math.random().toString(36).slice(2)}`;
  const numericId = extractNumericPostId(id);
  const title = (entry.title?.$t || 'Untitled Post').trim();
  const publishedAt = entry.published?.$t || '';
  const updatedAt = entry.updated?.$t || publishedAt;
  const formattedDate = formatPublishDate(publishedAt);
  const authorName = entry.author?.[0]?.name?.$t || 'Muavexa';

  const alternateLink = entry.link?.find((l) => l.rel === 'alternate')?.href;
  const selfLink = entry.link?.find((l) => l.rel === 'self')?.href;
  const url = alternateLink || selfLink || BLOG_BASE;

  const categories = (entry.category || [])
    .map((c) => (c.term || '').trim())
    .filter(Boolean);

  const rawHtml = entry.content?.$t || entry.summary?.$t || '';
  const { sanitizedHtml, plainText, firstImageUrl } = sanitizeAndExtractContent(rawHtml);

  const mediaThumb = entry.media$thumbnail?.url
    ? upgradeBloggerImageUrl(entry.media$thumbnail.url)
    : null;

  const thumbnailUrl = firstImageUrl || mediaThumb || null;

  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(words / 210));

  const excerpt =
    plainText.length > 180 ? `${plainText.slice(0, 177).trimEnd()}...` : plainText;

  return {
    id,
    numericId,
    title,
    url,
    publishedAt,
    updatedAt,
    formattedDate,
    authorName,
    categories,
    thumbnailUrl,
    excerpt,
    sanitizedHtml,
    plainText,
    readingTimeMinutes,
  };
}

/**
 * Performs a strictly uncached JSONP request against the live Blogger feed.
 * Works standalone in production builds without any Vite dev proxy or CORS issues.
 */
function fetchBloggerJsonp(feedUrl: string, timeoutMs = 15000): Promise<BloggerFeedRaw> {
  return new Promise((resolve, reject) => {
    const callbackName = `__muavexa_cb_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 9)}`;

    const separator = feedUrl.includes('?') ? '&' : '?';
    // Unique timestamp + callback ensures zero HTTP/browser caching
    const src = `${feedUrl}${separator}alt=json-in-script&callback=${callbackName}&_nocache=${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 7)}`;

    const script = document.createElement('script');
    script.src = src;
    script.async = true;

    let settled = false;
    const win = window as unknown as Record<string, unknown>;

    const cleanup = () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      delete win[callbackName];
      window.clearTimeout(timer);
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error('Request timed out while loading live posts from Muavexa.'));
    }, timeoutMs);

    win[callbackName] = (data: BloggerFeedRaw) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(
        new Error('Unable to reach muavexa.blogspot.com. Check your network connection.')
      );
    };

    document.head.appendChild(script);
  });
}

export async function fetchLivePosts(options?: {
  startIndex?: number;
  maxResults?: number;
  category?: string | null;
  query?: string | null;
}): Promise<FeedResponse> {
  const startIndex = options?.startIndex ?? 1;
  const maxResults = options?.maxResults ?? 10;
  const category = options?.category?.trim() || null;
  const query = options?.query?.trim() || null;

  let path = `${BLOG_BASE}/feeds/posts/default`;
  if (category) {
    path = `${BLOG_BASE}/feeds/posts/default/-/${encodeURIComponent(category)}`;
  }

  const params = new URLSearchParams();
  params.set('start-index', String(startIndex));
  params.set('max-results', String(maxResults));
  if (query) {
    params.set('q', query);
  }

  const data = await fetchBloggerJsonp(`${path}?${params.toString()}`);
  const feed = data.feed;

  const entries = feed?.entry || [];
  const posts = entries.map(parseEntry);
  const totalResults = Number(feed?.openSearch$totalResults?.$t || posts.length);
  const allCategories = (feed?.category || [])
    .map((c) => (c.term || '').trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return {
    posts,
    totalResults,
    allCategories,
    fetchedAt: new Date(),
  };
}

/**
 * Fetches live categories with real post counts by reading up to 150 posts from the live feed
 * (and reconciling any empty or overflow labels from feed.category). Zero caching.
 */
export async function fetchLiveCategoryDirectory(): Promise<{
  categories: CategoryInfo[];
  allPostsSnapshot: BlogPost[];
  fetchedAt: Date;
}> {
  const data = await fetchBloggerJsonp(
    `${BLOG_BASE}/feeds/posts/default?start-index=1&max-results=150`
  );
  const feed = data.feed;
  const entries = feed?.entry || [];
  const posts = entries.map(parseEntry);

  const countMap = new Map<string, number>();

  // Seed all known blog labels from feed.category
  for (const catNode of feed?.category || []) {
    const term = (catNode.term || '').trim();
    if (term && !countMap.has(term)) {
      countMap.set(term, 0);
    }
  }

  // Count live posts per label
  for (const post of posts) {
    for (const cat of post.categories) {
      countMap.set(cat, (countMap.get(cat) || 0) + 1);
    }
  }

  const categories: CategoryInfo[] = Array.from(countMap.entries())
    .map(([name, count]) => ({ name, count }))
    .filter((c) => c.count > 0 || (feed?.category || []).length > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return {
    categories,
    allPostsSnapshot: posts,
    fetchedAt: new Date(),
  };
}

export async function fetchSingleLivePostById(numericId: string): Promise<BlogPost | null> {
  try {
    const data = await fetchBloggerJsonp(
      `${BLOG_BASE}/feeds/posts/default/${encodeURIComponent(numericId)}`
    );
    if (data.entry) {
      return parseEntry(data.entry);
    }
    return null;
  } catch {
    return null;
  }
}

export function formatUpdatedTime(date: Date | null): string {
  if (!date) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `Updated ${hh}:${mm}`;
}
