import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Check,
  ExternalLink,
  Languages,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Share2,
  Square,
  Volume2,
} from 'lucide-react';
import { ALL_LANGUAGES, isRtlLanguage } from '../data/languages';
import { useSpeechReader } from '../hooks/useSpeechReader';
import { useTranslatedPosts } from '../hooks/useTranslatedPosts';
import { fetchLivePosts } from '../services/bloggerApi';
import {
  translateManyTexts,
  translateSanitizedHtml,
  translateText,
} from '../services/translateService';
import { BlogPost, FontSizeOption } from '../types/blog';
import { PostCard } from './PostCard';

interface PostReaderViewProps {
  post: BlogPost;
  onBack: () => void;
  onOpenPost: (post: BlogPost) => void;
  isBookmarked: boolean;
  onToggleBookmark: (post: BlogPost) => void;
  isPostBookmarked: (id: string, url?: string) => boolean;
  onSelectCategory: (category: string) => void;
  fontSize: FontSizeOption;
  onChangeFontSize: (size: FontSizeOption) => void;
  refreshSignal: number;
  targetLang: string | null;
  onOpenTranslate: () => void;
  onClearTranslate: () => void;
}

const FONT_SIZE_CLASSES: Record<FontSizeOption, string> = {
  small: 'text-[15px]',
  medium: 'text-[17px]',
  large: 'text-[19px]',
};

export function PostReaderView({
  post,
  onBack,
  onOpenPost,
  isBookmarked,
  onToggleBookmark,
  isPostBookmarked,
  onSelectCategory,
  fontSize,
  onChangeFontSize,
  refreshSignal,
  targetLang,
  onOpenTranslate,
  onClearTranslate,
}: PostReaderViewProps) {
  const articleContentRef = useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [shareFeedback, setShareFeedback] = useState<'idle' | 'copied' | 'shared'>('idle');
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Translation state for current article
  const [translatedTitle, setTranslatedTitle] = useState<string>(post.title);
  const [translatedCategories, setTranslatedCategories] = useState<string[]>(post.categories);
  const [translatedHtml, setTranslatedHtml] = useState<string>(post.sanitizedHtml);
  const [translatedPlainText, setTranslatedPlainText] = useState<string>(post.plainText);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  const isRtl = isRtlLanguage(targetLang);
  const dir = isRtl ? 'rtl' : 'ltr';
  const activeLangLabel = targetLang
    ? ALL_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang
    : null;

  useEffect(() => {
    if (!targetLang || targetLang === 'en') {
      setTranslatedTitle(post.title);
      setTranslatedCategories(post.categories);
      setTranslatedHtml(post.sanitizedHtml);
      setTranslatedPlainText(post.plainText);
      setIsTranslating(false);
      setTranslateError(null);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const runTranslation = async () => {
      setIsTranslating(true);
      setTranslateError(null);
      try {
        const [newTitle, newCats, bodyResult] = await Promise.all([
          translateText(post.title, targetLang, controller.signal),
          post.categories.length > 0
            ? translateManyTexts(post.categories, targetLang, controller.signal, 4)
            : Promise.resolve([]),
          translateSanitizedHtml(post.sanitizedHtml, targetLang, controller.signal),
        ]);

        if (!active) return;
        setTranslatedTitle(newTitle || post.title);
        setTranslatedCategories(newCats.length > 0 ? newCats : post.categories);
        setTranslatedHtml(bodyResult.translatedHtml || post.sanitizedHtml);
        setTranslatedPlainText(bodyResult.translatedPlainText || post.plainText);
      } catch (err) {
        if (!active) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setTranslatedTitle(post.title);
        setTranslatedCategories(post.categories);
        setTranslatedHtml(post.sanitizedHtml);
        setTranslatedPlainText(post.plainText);
        setTranslateError(
          err instanceof Error ? err.message : 'Unable to translate this article right now.'
        );
      } finally {
        if (active) {
          setIsTranslating(false);
        }
      }
    };

    void runTranslation();

    return () => {
      active = false;
      controller.abort();
    };
  }, [post.id, post.title, post.categories, post.sanitizedHtml, post.plainText, targetLang]);

  const speech = useSpeechReader(translatedTitle, translatedPlainText, targetLang);
  const { displayPosts: translatedRelated } = useTranslatedPosts(relatedPosts, targetLang);

  // Scroll to top when opening a new post
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setScrollProgress(0);
  }, [post.id]);

  // Dynamic Reading Progress Bar tracking scroll position within the post content
  useEffect(() => {
    const updateProgress = () => {
      const el = articleContentRef.current;
      if (!el) {
        setScrollProgress(0);
        return;
      }
      const rect = el.getBoundingClientRect();
      const elementTop = rect.top + window.scrollY;
      const elementHeight = el.offsetHeight;
      const viewportHeight = window.innerHeight;

      const scrollableDistance = Math.max(1, elementHeight - viewportHeight * 0.45);
      const currentProgress = window.scrollY - elementTop + viewportHeight * 0.25;
      const pct = Math.min(100, Math.max(0, (currentProgress / scrollableDistance) * 100));
      setScrollProgress(pct);
    };

    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [post.id, translatedHtml]);

  // Fetch up to 3 related posts sharing the same category/label
  useEffect(() => {
    let cancelled = false;

    const loadRelated = async () => {
      setLoadingRelated(true);
      try {
        const primaryCat = post.categories[0] || null;
        let candidates: BlogPost[] = [];

        if (primaryCat) {
          const catFeed = await fetchLivePosts({
            category: primaryCat,
            startIndex: 1,
            maxResults: 6,
          });
          candidates = catFeed.posts.filter((p) => p.id !== post.id);
        }

        if (candidates.length < 3) {
          const generalFeed = await fetchLivePosts({
            startIndex: 1,
            maxResults: 8,
          });
          const seenIds = new Set([post.id, ...candidates.map((c) => c.id)]);
          for (const item of generalFeed.posts) {
            if (!seenIds.has(item.id)) {
              candidates.push(item);
              seenIds.add(item.id);
            }
            if (candidates.length >= 3) break;
          }
        }

        if (!cancelled) {
          setRelatedPosts(candidates.slice(0, 3));
        }
      } catch {
        if (!cancelled) {
          setRelatedPosts([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingRelated(false);
        }
      }
    };

    void loadRelated();
    return () => {
      cancelled = true;
    };
  }, [post.id, post.categories, refreshSignal]);

  const handleShare = async () => {
    const shareData = {
      title: post.title,
      text: post.excerpt || post.title,
      url: post.url,
    };

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        setShareFeedback('shared');
        window.setTimeout(() => setShareFeedback('idle'), 2200);
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(post.url);
      setShareFeedback('copied');
      window.setTimeout(() => setShareFeedback('idle'), 2200);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = post.url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setShareFeedback('copied');
      window.setTimeout(() => setShareFeedback('idle'), 2200);
    }
  };

  const openOriginalRelated = (clicked: BlogPost) => {
    const original = relatedPosts.find((p) => p.id === clicked.id) || clicked;
    onOpenPost(original);
  };

  const toggleOriginalRelatedBookmark = (clicked: BlogPost) => {
    const original = relatedPosts.find((p) => p.id === clicked.id) || clicked;
    onToggleBookmark(original);
  };

  return (
    <div className="relative">
      {/* Top Reading Progress Bar (#0F3D3E track, #177E70 filled portion) */}
      <div
        className="fixed top-0 left-0 right-0 h-[3.5px] z-50 bg-[#0F3D3E]"
        role="progressbar"
        aria-label="Article reading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(scrollProgress)}
      >
        <div
          className="h-full bg-[#177E70] transition-[width] duration-75 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <article className="max-w-3xl mx-auto">
        {/* Top Back & Quick Actions Row */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] px-3.5 py-2 -ml-2 rounded-xl inline-flex items-center gap-2 text-sm font-semibold text-[#0F3D3E] dark:text-[#BFE3D6] hover:bg-[#E5ECEB] dark:hover:bg-[#162326] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onToggleBookmark(post)}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
              aria-pressed={isBookmarked}
              className={`min-h-[44px] px-3.5 rounded-xl inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-[#BFE3D6]/35 dark:bg-[#177E70]/30 text-[#0F3D3E] dark:text-[#BFE3D6]'
                  : 'bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] text-[#5B7C8A] dark:text-[#9BB3BD] hover:text-[#0F3D3E] dark:hover:text-[#ECF2F2]'
              }`}
            >
              <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
              <span>{isBookmarked ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleShare()}
              aria-label="Share article"
              className="min-h-[44px] px-3.5 rounded-xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] hover:border-[#177E70] text-xs font-semibold text-[#0F3D3E] dark:text-[#ECF2F2] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {shareFeedback === 'copied' || shareFeedback === 'shared' ? (
                <>
                  <Check className="w-4 h-4 text-[#177E70] dark:text-[#BFE3D6]" />
                  <span>{shareFeedback === 'copied' ? 'Link copied' : 'Shared'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Article Header */}
        <header
          dir={dir}
          className="space-y-4 pb-6 border-b border-[#DCE6E5] dark:border-[#1E2E31]"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm font-medium text-[#5B7C8A] dark:text-[#9BB3BD]">
            {translatedCategories.length > 0 && (
              <>
                {translatedCategories.map((cat, idx) => (
                  <React.Fragment key={`${cat}-${idx}`}>
                    <button
                      type="button"
                      onClick={() => onSelectCategory(post.categories[idx] || cat)}
                      className="text-[#177E70] dark:text-[#BFE3D6] font-semibold hover:underline underline-offset-4 cursor-pointer"
                    >
                      {cat}
                    </button>
                    {idx < translatedCategories.length - 1 && <span aria-hidden="true">/</span>}
                  </React.Fragment>
                ))}
                <span aria-hidden="true">·</span>
              </>
            )}
            {post.formattedDate && (
              <>
                <time dateTime={post.publishedAt}>{post.formattedDate}</time>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="tabular-nums">{post.readingTimeMinutes} min read</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.16] tracking-tight text-[#0F3D3E] dark:text-[#ECF2F2]">
            {translatedTitle}
          </h1>

          <div
            dir="ltr"
            className="flex items-center justify-between gap-4 pt-1 text-xs sm:text-sm text-[#5B7C8A] dark:text-[#9BB3BD]"
          >
            <span>By {post.authorName}</span>
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-[#177E70] dark:hover:text-[#BFE3D6] transition-colors"
            >
              <span>Original post</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* Reader Controls Toolbar: Font Size + Translate + Listen (TTS) */}
        <div className="my-6 p-3 rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] flex flex-wrap items-center justify-between gap-3">
          {/* Font Size Controls */}
          <div className="flex items-center gap-1.5" role="group" aria-label="Text size">
            <span className="text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD] px-2">
              Text
            </span>
            {(['small', 'medium', 'large'] as FontSizeOption[]).map((size) => {
              const isSelected = fontSize === size;
              const label = size === 'small' ? 'Small' : size === 'medium' ? 'Medium' : 'Large';
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => onChangeFontSize(size)}
                  aria-pressed={isSelected}
                  className={`min-h-[40px] px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#0F3D3E] text-white dark:bg-[#BFE3D6] dark:text-[#0F3D3E]'
                      : 'text-[#5B7C8A] dark:text-[#9BB3BD] hover:bg-[#F0F5F4] dark:hover:bg-[#182628]'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Translate & Audio Controls */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenTranslate}
              className={`min-h-[40px] px-3.5 rounded-xl inline-flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                targetLang
                  ? 'bg-[#0F3D3E] text-white dark:bg-[#BFE3D6] dark:text-[#0F3D3E]'
                  : 'bg-[#F0F5F4] dark:bg-[#182628] text-[#0F3D3E] dark:text-[#ECF2F2] hover:bg-[#E1ECEA] dark:hover:bg-[#213337]'
              }`}
            >
              {isTranslating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Languages className="w-4 h-4" />
              )}
              <span>
                {isTranslating
                  ? 'Translating...'
                  : activeLangLabel
                  ? activeLangLabel
                  : 'Translate'}
              </span>
            </button>

            {targetLang && (
              <button
                type="button"
                onClick={onClearTranslate}
                title="Show original English"
                aria-label="Restore original language"
                className="min-h-[40px] px-2.5 rounded-xl bg-[#F0F5F4] dark:bg-[#182628] text-xs font-semibold text-[#5B7C8A] dark:text-[#9BB3BD] hover:text-[#0F3D3E] dark:hover:text-white inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Original</span>
              </button>
            )}

            {speech.isSupported && (
              <>
                <button
                  type="button"
                  onClick={speech.togglePlayPause}
                  className={`min-h-[40px] px-4 rounded-xl inline-flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                    speech.isSpeaking
                      ? 'bg-[#177E70] text-white'
                      : 'bg-[#0F3D3E]/10 dark:bg-[#BFE3D6]/15 text-[#0F3D3E] dark:text-[#BFE3D6] hover:bg-[#0F3D3E] hover:text-white dark:hover:bg-[#BFE3D6] dark:hover:text-[#0F3D3E]'
                  }`}
                >
                  {!speech.isSpeaking ? (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Listen to Article</span>
                    </>
                  ) : speech.isPaused ? (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Resume Audio</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause Audio</span>
                    </>
                  )}
                </button>

                {speech.isSpeaking && (
                  <button
                    type="button"
                    onClick={speech.stop}
                    aria-label="Stop listening"
                    title="Stop listening"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-[#F0F5F4] dark:bg-[#182628] text-[#0F3D3E] dark:text-[#ECF2F2] hover:bg-[#DCE6E5] dark:hover:bg-[#233538] transition-colors cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Translation feedback if error occurred */}
        {translateError && (
          <div className="mb-6 rounded-xl bg-[#0F3D3E]/5 dark:bg-[#BFE3D6]/10 border border-[#DCE6E5] dark:border-[#1E2E31] px-4 py-3 flex items-center justify-between gap-3 text-xs text-[#4A6570] dark:text-[#BFE3D6]">
            <span>{translateError}</span>
            <button
              type="button"
              onClick={onOpenTranslate}
              className="font-semibold underline shrink-0 cursor-pointer"
            >
              Change language
            </button>
          </div>
        )}

        {/* Sanitized Blogger HTML Content */}
        <div
          ref={articleContentRef}
          dir={dir}
          className={`muavexa-prose ${FONT_SIZE_CLASSES[fontSize]} text-[#1E2B2D] dark:text-[#DCE6E6] pb-10 ${
            isTranslating ? 'opacity-70 transition-opacity' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: translatedHtml }}
        />

        {/* Bottom Share & Bookmark Bar */}
        <div className="py-6 border-t border-b border-[#DCE6E5] dark:border-[#1E2E31] flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm font-medium text-[#5B7C8A] dark:text-[#9BB3BD]">
            Enjoyed this article? Save or share it.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleBookmark(post)}
              className={`min-h-[44px] px-4 rounded-xl inline-flex items-center gap-2 text-xs font-semibold transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-[#0F3D3E] text-white dark:bg-[#BFE3D6] dark:text-[#0F3D3E]'
                  : 'bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] text-[#0F3D3E] dark:text-[#ECF2F2]'
              }`}
            >
              <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
              <span>{isBookmarked ? 'Bookmarked' : 'Bookmark'}</span>
            </button>

            <button
              type="button"
              onClick={() => void handleShare()}
              className="min-h-[44px] px-4 rounded-xl bg-[#177E70] hover:bg-[#0F3D3E] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              {shareFeedback === 'copied' || shareFeedback === 'shared' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>{shareFeedback === 'copied' ? 'Link copied' : 'Shared'}</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Article</span>
                </>
              )}
            </button>
          </div>
        </div>
      </article>

      {/* Related Posts (3 articles sharing category/label) */}
      {(loadingRelated || relatedPosts.length > 0) && (
        <section className="max-w-5xl mx-auto mt-12 space-y-5" aria-label="Related articles">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#0F3D3E] dark:text-[#ECF2F2]">
              Related Articles
            </h2>
            {post.categories[0] && (
              <button
                type="button"
                onClick={() => onSelectCategory(post.categories[0])}
                className="text-xs font-semibold text-[#177E70] dark:text-[#BFE3D6] hover:underline cursor-pointer"
              >
                More in {post.categories[0]}
              </button>
            )}
          </div>

          {loadingRelated ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] skeleton-shimmer"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {translatedRelated.map((rel) => (
                <PostCard
                  key={rel.id}
                  post={rel}
                  onOpenPost={openOriginalRelated}
                  isBookmarked={isPostBookmarked(rel.id, rel.url)}
                  onToggleBookmark={toggleOriginalRelatedBookmark}
                  dir={dir}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
