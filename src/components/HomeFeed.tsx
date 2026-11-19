import React, { useRef, useState } from 'react';
import { ArrowDown, Languages, Loader2, RefreshCw } from 'lucide-react';
import { ALL_LANGUAGES, isRtlLanguage } from '../data/languages';
import { useTranslatedPosts } from '../hooks/useTranslatedPosts';
import { BlogPost } from '../types/blog';
import { ErrorState } from './ErrorState';
import { FeaturedHeroPost, PostCard } from './PostCard';
import { HomeFeedSkeleton } from './SkeletonCards';

interface HomeFeedProps {
  posts: BlogPost[];
  totalResults: number;
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  isLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  error: string | null;
  onRefresh: () => void;
  onLoadMore: () => void;
  onOpenPost: (post: BlogPost) => void;
  isBookmarked: (id: string, url?: string) => boolean;
  onToggleBookmark: (post: BlogPost) => void;
  targetLang: string | null;
}

const PULL_THRESHOLD = 68;

export function HomeFeed({
  posts,
  totalResults,
  categories,
  selectedCategory,
  onSelectCategory,
  isLoading,
  isLoadingMore,
  isRefreshing,
  error,
  onRefresh,
  onLoadMore,
  onOpenPost,
  isBookmarked,
  onToggleBookmark,
  targetLang,
}: HomeFeedProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const startYRef = useRef<number | null>(null);
  const isPullingRef = useRef(false);

  const { displayPosts, isTranslating, translateError } = useTranslatedPosts(
    posts,
    targetLang
  );
  const dir = isRtlLanguage(targetLang) ? 'rtl' : 'ltr';
  const activeLangName = targetLang
    ? ALL_LANGUAGES.find((l) => l.code === targetLang)?.name || targetLang
    : null;

  const openOriginalPost = (clicked: BlogPost) => {
    const original = posts.find((p) => p.id === clicked.id) || clicked;
    onOpenPost(original);
  };

  const toggleOriginalBookmark = (clicked: BlogPost) => {
    const original = posts.find((p) => p.id === clicked.id) || clicked;
    onToggleBookmark(original);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY <= 2 && !isRefreshing && !isLoading) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = true;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPullingRef.current || startYRef.current === null) return;
    if (window.scrollY > 2) {
      isPullingRef.current = false;
      setPullDistance(0);
      return;
    }
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      // Smooth resistance curve
      const damped = Math.min(96, delta * 0.45);
      setPullDistance(damped);
    } else {
      setPullDistance(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isPullingRef.current) return;
    isPullingRef.current = false;
    startYRef.current = null;
    if (pullDistance >= PULL_THRESHOLD) {
      setPullDistance(0);
      onRefresh();
    } else {
      setPullDistance(0);
    }
  };

  const hasMore = posts.length < totalResults;
  const heroPost = displayPosts.length > 0 ? displayPosts[0] : null;
  const remainingPosts = displayPosts.length > 1 ? displayPosts.slice(1) : [];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="space-y-6"
    >
      {/* Touch Pull-to-Refresh Indicator */}
      {(pullDistance > 6 || isRefreshing) && (
        <div
          style={{
            height: isRefreshing ? 44 : Math.max(24, pullDistance),
          }}
          className="flex items-center justify-center gap-2 text-xs font-medium text-[#177E70] dark:text-[#BFE3D6] overflow-hidden transition-all duration-150"
          aria-live="polite"
        >
          {isRefreshing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Syncing latest posts...</span>
            </>
          ) : (
            <>
              <ArrowDown
                className={`w-4 h-4 transition-transform duration-150 ${
                  pullDistance >= PULL_THRESHOLD ? 'rotate-180' : ''
                }`}
              />
              <span>
                {pullDistance >= PULL_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </>
          )}
        </div>
      )}

      {/* Interactive Category Filter Strip */}
      {categories.length > 0 && (
        <div
          className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 sm:mx-0 sm:px-0"
          role="tablist"
          aria-label="Filter articles by category"
        >
          <button
            type="button"
            role="tab"
            aria-selected={selectedCategory === null}
            onClick={() => onSelectCategory(null)}
            className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              selectedCategory === null
                ? 'bg-[#0F3D3E] text-white dark:bg-[#BFE3D6] dark:text-[#0F3D3E]'
                : 'bg-white dark:bg-[#131D20] text-[#5B7C8A] dark:text-[#9BB3BD] border border-[#DCE6E5] dark:border-[#1E2E31] hover:text-[#0F3D3E] dark:hover:text-[#ECF2F2]'
            }`}
          >
            All Stories
          </button>

          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelectCategory(isActive ? null : cat)}
                className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#0F3D3E] text-white dark:bg-[#BFE3D6] dark:text-[#0F3D3E]'
                    : 'bg-white dark:bg-[#131D20] text-[#5B7C8A] dark:text-[#9BB3BD] border border-[#DCE6E5] dark:border-[#1E2E31] hover:text-[#0F3D3E] dark:hover:text-[#ECF2F2]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Subtle Translation Status Bar */}
      {(isTranslating || translateError) && (
        <div className="rounded-xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-[#0F3D3E] dark:text-[#BFE3D6]">
          {isTranslating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#177E70]" />
              <span>Translating stories to {activeLangName}...</span>
            </>
          ) : (
            <>
              <Languages className="w-3.5 h-3.5 text-[#5B7C8A]" />
              <span className="text-[#5B7C8A] dark:text-[#9BB3BD]">{translateError}</span>
            </>
          )}
        </div>
      )}

      {isLoading && posts.length === 0 ? (
        <HomeFeedSkeleton />
      ) : error && posts.length === 0 ? (
        <ErrorState message={error} onRetry={onRefresh} isRetrying={isRefreshing} />
      ) : posts.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] p-10 text-center">
          <p className="font-serif text-lg font-semibold text-[#111C1D] dark:text-[#ECF2F2] mb-1">
            No articles found
          </p>
          <p className="text-sm text-[#5B7C8A] dark:text-[#9BB3BD] mb-4">
            {selectedCategory
              ? `There are currently no published posts in "${selectedCategory}".`
              : 'No posts were returned from the live feed.'}
          </p>
          {selectedCategory && (
            <button
              type="button"
              onClick={() => onSelectCategory(null)}
              className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0F3D3E] text-white text-sm font-semibold hover:bg-[#177E70] transition-colors cursor-pointer"
            >
              Show all stories
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {selectedCategory && (
            <div className="flex items-center justify-between border-b border-[#DCE6E5] dark:border-[#1E2E31] pb-3">
              <div>
                <p className="text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD]">
                  Filtered by category
                </p>
                <h1 className="font-serif text-2xl font-semibold text-[#0F3D3E] dark:text-[#ECF2F2]">
                  {selectedCategory}
                </h1>
              </div>
              <span className="text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD] tabular-nums">
                {totalResults} {totalResults === 1 ? 'article' : 'articles'}
              </span>
            </div>
          )}

          {heroPost && (
            <FeaturedHeroPost
              post={heroPost}
              onOpenPost={openOriginalPost}
              isBookmarked={isBookmarked(heroPost.id, heroPost.url)}
              onToggleBookmark={toggleOriginalBookmark}
              onCategoryClick={(cat) => onSelectCategory(cat)}
              dir={dir}
            />
          )}

          {remainingPosts.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {remainingPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpenPost={openOriginalPost}
                  isBookmarked={isBookmarked(post.id, post.url)}
                  onToggleBookmark={toggleOriginalBookmark}
                  onCategoryClick={(cat) => onSelectCategory(cat)}
                  dir={dir}
                />
              ))}
            </div>
          )}

          {error && posts.length > 0 && (
            <div className="rounded-xl bg-[#0F3D3E]/5 dark:bg-[#BFE3D6]/10 border border-[#DCE6E5] dark:border-[#1E2E31] p-4 flex items-center justify-between gap-4">
              <p className="text-xs sm:text-sm text-[#4A6570] dark:text-[#BFE3D6]">{error}</p>
              <button
                type="button"
                onClick={onRefresh}
                className="min-h-[40px] px-4 py-1.5 rounded-lg bg-[#0F3D3E] text-white text-xs font-semibold shrink-0 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {hasMore && (
            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isLoadingMore}
                className="min-h-[48px] px-7 py-3 rounded-xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] hover:border-[#177E70] dark:hover:border-[#BFE3D6] text-sm font-semibold text-[#0F3D3E] dark:text-[#ECF2F2] inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-60"
              >
                {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin text-[#177E70]" />}
                <span>{isLoadingMore ? 'Loading more posts...' : 'Load More Posts'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
