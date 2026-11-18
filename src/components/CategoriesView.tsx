import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, FolderOpen, Loader2 } from 'lucide-react';
import { fetchLivePosts } from '../services/bloggerApi';
import { BlogPost, CategoryInfo } from '../types/blog';
import { ErrorState } from './ErrorState';
import { PostCard } from './PostCard';
import { CategoriesSkeleton, PostListSkeleton } from './SkeletonCards';

interface CategoriesViewProps {
  categories: CategoryInfo[];
  isLoadingDirectory: boolean;
  directoryError: string | null;
  onRetryDirectory: () => void;
  onOpenPost: (post: BlogPost) => void;
  isBookmarked: (id: string, url?: string) => boolean;
  onToggleBookmark: (post: BlogPost) => void;
  refreshSignal: number;
}

export function CategoriesView({
  categories,
  isLoadingDirectory,
  directoryError,
  onRetryDirectory,
  onOpenPost,
  isBookmarked,
  onToggleBookmark,
  refreshSignal,
}: CategoriesViewProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [catPosts, setCatPosts] = useState<BlogPost[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);

  const loadCategoryPosts = async (categoryName: string, append = false, startIndex = 1) => {
    if (append) {
      setIsLoadingMore(true);
    } else {
      setIsLoadingPosts(true);
      setPostsError(null);
    }
    try {
      const res = await fetchLivePosts({
        category: categoryName,
        startIndex,
        maxResults: 12,
      });
      setCatPosts((prev) => (append ? [...prev, ...res.posts] : res.posts));
      setTotalResults(res.totalResults);
    } catch (err) {
      setPostsError(err instanceof Error ? err.message : 'Failed to load category posts.');
    } finally {
      setIsLoadingPosts(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (activeCategory) {
      void loadCategoryPosts(activeCategory, false, 1);
    }
  }, [activeCategory, refreshSignal]);

  if (activeCategory) {
    const hasMore = catPosts.length < totalResults;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 border-b border-[#DCE6E5] dark:border-[#1E2E31] pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                setActiveCategory(null);
                setCatPosts([]);
              }}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] text-[#0F3D3E] dark:text-[#ECF2F2] hover:border-[#177E70] transition-colors cursor-pointer shrink-0"
              aria-label="Back to categories"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD]">Category</p>
              <h1 className="font-serif text-xl sm:text-2xl font-semibold text-[#0F3D3E] dark:text-[#ECF2F2] truncate">
                {activeCategory}
              </h1>
            </div>
          </div>

          {!isLoadingPosts && (
            <span className="text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD] tabular-nums shrink-0">
              {totalResults} {totalResults === 1 ? 'post' : 'posts'}
            </span>
          )}
        </div>

        {isLoadingPosts ? (
          <PostListSkeleton count={6} />
        ) : postsError && catPosts.length === 0 ? (
          <ErrorState
            message={postsError}
            onRetry={() => loadCategoryPosts(activeCategory, false, 1)}
          />
        ) : catPosts.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] p-10 text-center">
            <p className="font-serif text-lg font-semibold text-[#111C1D] dark:text-[#ECF2F2]">
              No posts in {activeCategory}
            </p>
            <p className="text-sm text-[#5B7C8A] dark:text-[#9BB3BD] mt-1">
              Check back later or explore another topic.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {catPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpenPost={onOpenPost}
                  isBookmarked={isBookmarked(post.id, post.url)}
                  onToggleBookmark={onToggleBookmark}
                  onCategoryClick={(cat) => setActiveCategory(cat)}
                />
              ))}
            </div>

            {hasMore && (
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={() => loadCategoryPosts(activeCategory, true, catPosts.length + 1)}
                  disabled={isLoadingMore}
                  className="min-h-[48px] px-7 py-3 rounded-xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] text-sm font-semibold text-[#0F3D3E] dark:text-[#ECF2F2] inline-flex items-center gap-2 cursor-pointer"
                >
                  {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin text-[#177E70]" />}
                  <span>{isLoadingMore ? 'Loading...' : 'Load More Posts'}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#DCE6E5] dark:border-[#1E2E31] pb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F3D3E] dark:text-[#ECF2F2]">
            Categories
          </h1>
          <p className="text-sm text-[#5B7C8A] dark:text-[#9BB3BD] mt-1">
            Browse live topics synced directly from Muavexa
          </p>
        </div>
        {!isLoadingDirectory && categories.length > 0 && (
          <span className="text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD] tabular-nums whitespace-nowrap">
            {categories.length} {categories.length === 1 ? 'topic' : 'topics'}
          </span>
        )}
      </div>

      {isLoadingDirectory && categories.length === 0 ? (
        <CategoriesSkeleton />
      ) : directoryError && categories.length === 0 ? (
        <ErrorState message={directoryError} onRetry={onRetryDirectory} />
      ) : categories.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] p-10 text-center">
          <FolderOpen className="w-8 h-8 text-[#5B7C8A] mx-auto mb-3" />
          <p className="font-serif text-lg font-semibold text-[#111C1D] dark:text-[#ECF2F2]">
            No categories available yet
          </p>
          <p className="text-sm text-[#5B7C8A] dark:text-[#9BB3BD] mt-1">
            Labels added to posts on Blogger will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => setActiveCategory(cat.name)}
              className="group min-h-[76px] rounded-xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] hover:border-[#177E70] dark:hover:border-[#BFE3D6] p-4 flex items-center justify-between gap-4 text-left transition-colors cursor-pointer"
            >
              <div className="min-w-0">
                <h2 className="font-serif text-base sm:text-lg font-semibold text-[#111C1D] dark:text-[#ECF2F2] group-hover:text-[#177E70] dark:group-hover:text-[#BFE3D6] truncate transition-colors">
                  {cat.name}
                </h2>
                <p className="text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD] tabular-nums mt-0.5">
                  {cat.count} {cat.count === 1 ? 'article' : 'articles'}
                </p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#F0F5F4] dark:bg-[#182628] text-[#0F3D3E] dark:text-[#BFE3D6] flex items-center justify-center shrink-0 group-hover:bg-[#0F3D3E] group-hover:text-white dark:group-hover:bg-[#BFE3D6] dark:group-hover:text-[#0F3D3E] transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
