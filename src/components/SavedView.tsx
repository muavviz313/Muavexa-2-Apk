import React, { useEffect, useState } from 'react';
import { Bookmark, Trash2 } from 'lucide-react';
import { isRtlLanguage } from '../data/languages';
import { useTranslatedPosts } from '../hooks/useTranslatedPosts';
import { fetchLivePosts, fetchSingleLivePostById } from '../services/bloggerApi';
import { BlogPost, BookmarkRef } from '../types/blog';
import { ErrorState } from './ErrorState';
import { PostCard } from './PostCard';
import { PostListSkeleton } from './SkeletonCards';

interface SavedViewProps {
  bookmarks: BookmarkRef[];
  onRemoveBookmark: (id: string, url?: string) => void;
  onClearBookmarks: () => void;
  onOpenPost: (post: BlogPost) => void;
  isBookmarked: (id: string, url?: string) => boolean;
  onToggleBookmark: (post: BlogPost) => void;
  refreshSignal: number;
  onSynced?: (date: Date) => void;
  targetLang: string | null;
}

export function SavedView({
  bookmarks,
  onRemoveBookmark,
  onClearBookmarks,
  onOpenPost,
  isBookmarked,
  onToggleBookmark: _onToggleBookmark,
  refreshSignal,
  onSynced,
  targetLang,
}: SavedViewProps) {
  const [savedPosts, setSavedPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const { displayPosts } = useTranslatedPosts(savedPosts, targetLang);
  const dir = isRtlLanguage(targetLang) ? 'rtl' : 'ltr';

  const openOriginalPost = (clicked: BlogPost) => {
    const original = savedPosts.find((p) => p.id === clicked.id) || clicked;
    onOpenPost(original);
  };

  const hydrateBookmarksLive = async () => {
    if (bookmarks.length === 0) {
      setSavedPosts([]);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Always fetch fresh posts directly from live Blogger feed (zero cached content)
      const feed = await fetchLivePosts({ startIndex: 1, maxResults: 150 });
      const livePool = feed.posts;

      const resolved: BlogPost[] = [];
      const missingRefs: BookmarkRef[] = [];

      for (const ref of bookmarks) {
        const match = livePool.find((p) => p.id === ref.id || p.url === ref.url);
        if (match) {
          resolved.push(match);
        } else {
          missingRefs.push(ref);
        }
      }

      // Fetch any older saved posts individually by numeric post ID
      if (missingRefs.length > 0) {
        const extra = await Promise.all(
          missingRefs.map(async (ref) => {
            const match = ref.id.match(/post-(\d+)/);
            if (!match) return null;
            return fetchSingleLivePostById(match[1]);
          })
        );
        for (const item of extra) {
          if (item) resolved.push(item);
        }
      }

      setSavedPosts(resolved);
      onSynced?.(feed.fetchedAt);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to sync your saved articles right now.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void hydrateBookmarksLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookmarks.length, refreshSignal]);

  return (
    <div className="space-y-6">
      <div className="border-b border-[#DCE6E5] dark:border-[#1E2E31] pb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F3D3E] dark:text-[#ECF2F2]">
            Saved Articles
          </h1>
          <p className="text-sm text-[#5B7C8A] dark:text-[#9BB3BD] mt-1">
            Bookmarked locally, always loaded fresh from the live feed
          </p>
        </div>

        {bookmarks.length > 0 && (
          <div className="flex items-center gap-2">
            {confirmClear ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearBookmarks();
                    setConfirmClear(false);
                  }}
                  className="min-h-[40px] px-3.5 py-1.5 rounded-lg bg-[#0F3D3E] text-white text-xs font-semibold cursor-pointer"
                >
                  Confirm clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#DCE6E5] dark:border-[#1E2E31] text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD] cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="min-h-[40px] px-3.5 py-1.5 rounded-lg border border-[#DCE6E5] dark:border-[#1E2E31] hover:border-[#177E70] text-xs font-semibold text-[#5B7C8A] dark:text-[#9BB3BD] hover:text-[#0F3D3E] dark:hover:text-[#ECF2F2] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all ({bookmarks.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {bookmarks.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] p-10 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#0F3D3E]/10 dark:bg-[#BFE3D6]/10 text-[#0F3D3E] dark:text-[#BFE3D6] flex items-center justify-center mx-auto mb-4">
            <Bookmark className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-lg font-semibold text-[#111C1D] dark:text-[#ECF2F2]">
            No saved articles yet
          </h2>
          <p className="text-sm text-[#5B7C8A] dark:text-[#9BB3BD] mt-1 max-w-md mx-auto">
            Tap the bookmark icon on any story or inside the article reader to keep a quick list here.
          </p>
        </div>
      ) : isLoading && savedPosts.length === 0 ? (
        <PostListSkeleton count={Math.min(4, bookmarks.length)} />
      ) : error && savedPosts.length === 0 ? (
        <ErrorState message={error} onRetry={() => void hydrateBookmarksLive()} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayPosts.map((post) => (
            <div key={post.id} className="flex flex-col">
              <PostCard
                post={post}
                onOpenPost={openOriginalPost}
                isBookmarked={isBookmarked(post.id, post.url)}
                onToggleBookmark={() => onRemoveBookmark(post.id, post.url)}
                dir={dir}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
