import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BottomNav } from './components/BottomNav';
import { CategoriesView } from './components/CategoriesView';
import { Header } from './components/Header';
import { HomeFeed } from './components/HomeFeed';
import { PostReaderView } from './components/PostReaderView';
import { SavedView } from './components/SavedView';
import { SearchView } from './components/SearchView';
import { useBookmarks } from './hooks/useBookmarks';
import {
  fetchLiveCategoryDirectory,
  fetchLivePosts,
  fetchSingleLivePostById,
  formatUpdatedTime,
} from './services/bloggerApi';
import { BlogPost, CategoryInfo, FontSizeOption, TabId } from './types/blog';

const THEME_STORAGE_KEY = 'muavexa_theme_v1';
const FONT_SIZE_STORAGE_KEY = 'muavexa_font_size_v1';
const PAGE_SIZE = 10;

function getInitialTheme(): boolean {
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
  } catch {
    // Ignore storage access errors
  }
  return (
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );
}

function getInitialFontSize(): FontSizeOption {
  try {
    const saved = window.localStorage.getItem(FONT_SIZE_STORAGE_KEY);
    if (saved === 'small' || saved === 'medium' || saved === 'large') {
      return saved;
    }
  } catch {
    // Ignore
  }
  return 'medium';
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(getInitialTheme);
  const [fontSize, setFontSize] = useState<FontSizeOption>(getInitialFontSize);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  // Home feed state (strictly live, zero caching)
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);

  // Live categories directory state
  const [categoryDirectory, setCategoryDirectory] = useState<CategoryInfo[]>([]);
  const [allCategoryNames, setAllCategoryNames] = useState<string[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(true);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  // Sync status timestamp & child refresh trigger
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const { bookmarks, isBookmarked, toggleBookmark, removeBookmark, clearBookmarks } =
    useBookmarks();

  const activePostRef = useRef<BlogPost | null>(null);
  activePostRef.current = activePost;

  // Apply .dark class to <html> element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore
    }
  }, [isDark]);

  // Persist font size choice
  useEffect(() => {
    try {
      window.localStorage.setItem(FONT_SIZE_STORAGE_KEY, fontSize);
    } catch {
      // Ignore
    }
  }, [fontSize]);

  const loadFeed = useCallback(
    async (options?: {
      category?: string | null;
      append?: boolean;
      startIndex?: number;
      silentRefresh?: boolean;
    }) => {
      const category =
        options?.category !== undefined ? options.category : selectedCategory;
      const append = options?.append ?? false;
      const startIndex = options?.startIndex ?? 1;

      if (append) {
        setIsLoadingMore(true);
      } else if (options?.silentRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoadingFeed(true);
      }

      if (!append) {
        setFeedError(null);
      }

      try {
        const res = await fetchLivePosts({
          category,
          startIndex,
          maxResults: PAGE_SIZE,
        });

        setPosts((prev) => {
          if (!append) return res.posts;
          const seen = new Set(prev.map((p) => p.id));
          const uniqueNext = res.posts.filter((p) => !seen.has(p.id));
          return [...prev, ...uniqueNext];
        });
        setTotalResults(res.totalResults);
        if (res.allCategories.length > 0) {
          setAllCategoryNames(res.allCategories);
        }
        setLastUpdated(res.fetchedAt);
        setFeedError(null);
      } catch (err) {
        setFeedError(
          err instanceof Error
            ? err.message
            : 'Unable to fetch fresh posts from Muavexa.'
        );
      } finally {
        setIsLoadingFeed(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [selectedCategory]
  );

  const loadDirectory = useCallback(async () => {
    setIsLoadingDirectory(true);
    setDirectoryError(null);
    try {
      const res = await fetchLiveCategoryDirectory();
      setCategoryDirectory(res.categories);
      if (res.categories.length > 0) {
        setAllCategoryNames(res.categories.map((c) => c.name));
      }
      setLastUpdated(res.fetchedAt);
    } catch (err) {
      setDirectoryError(
        err instanceof Error ? err.message : 'Unable to load categories.'
      );
    } finally {
      setIsLoadingDirectory(false);
    }
  }, []);

  const refreshAllLive = useCallback(async () => {
    setIsRefreshing(true);
    const tasks: Promise<unknown>[] = [
      loadFeed({ category: selectedCategory, silentRefresh: true }),
      loadDirectory(),
    ];

    // If an article is currently open, fetch its freshest content too
    const currentPost = activePostRef.current;
    if (currentPost?.numericId) {
      tasks.push(
        fetchSingleLivePostById(currentPost.numericId).then((fresh) => {
          if (fresh) {
            setActivePost(fresh);
          }
        })
      );
    }

    setRefreshSignal((prev) => prev + 1);
    await Promise.allSettled(tasks);
    setIsRefreshing(false);
  }, [loadDirectory, loadFeed, selectedCategory]);

  // Initial directory load on mount (zero cache)
  useEffect(() => {
    void loadDirectory();
  }, [loadDirectory]);

  // Load live feed on mount and whenever selectedCategory changes
  useEffect(() => {
    void loadFeed({ category: selectedCategory });
  }, [loadFeed, selectedCategory]);

  // Auto-refresh whenever browser tab regains focus (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshAllLive();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshAllLive]);

  // Sync browser back button when reading an article
  useEffect(() => {
    const handlePopState = () => {
      if (!window.location.hash.startsWith('#post=')) {
        setActivePost(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleOpenPost = (post: BlogPost) => {
    setActivePost(post);
    const postKey = post.numericId || encodeURIComponent(post.id);
    if (window.location.hash !== `#post=${postKey}`) {
      window.history.pushState({ postKey }, '', `#post=${postKey}`);
    }
  };

  const handleClosePost = () => {
    setActivePost(null);
    if (window.location.hash.startsWith('#post=')) {
      window.history.back();
    }
  };

  const handleSelectTab = (tab: TabId) => {
    setActivePost(null);
    if (window.location.hash.startsWith('#post=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCategoryFromAnywhere = (category: string | null) => {
    setActivePost(null);
    if (window.location.hash.startsWith('#post=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setActiveTab('home');
    setSelectedCategory(category);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogoClick = () => {
    setActivePost(null);
    if (window.location.hash.startsWith('#post=')) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    setSelectedCategory(null);
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updatedLabel = formatUpdatedTime(lastUpdated);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F8] text-[#111C1D] dark:bg-[#0B1214] dark:text-[#ECF2F2] transition-colors duration-200">
      <Header
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onRefresh={() => void refreshAllLive()}
        isRefreshing={isRefreshing}
        updatedLabel={updatedLabel}
        onLogoClick={handleLogoClick}
      />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24 md:pb-12">
        <AnimatePresence mode="wait">
          {activePost ? (
            <motion.div
              key={`reader-${activePost.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <PostReaderView
                post={activePost}
                onBack={handleClosePost}
                onOpenPost={handleOpenPost}
                isBookmarked={isBookmarked(activePost.id, activePost.url)}
                onToggleBookmark={toggleBookmark}
                isPostBookmarked={isBookmarked}
                onSelectCategory={(cat) => handleSelectCategoryFromAnywhere(cat)}
                fontSize={fontSize}
                onChangeFontSize={setFontSize}
                refreshSignal={refreshSignal}
              />
            </motion.div>
          ) : (
            <motion.div
              key={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeTab === 'home' && (
                <HomeFeed
                  posts={posts}
                  totalResults={totalResults}
                  categories={allCategoryNames}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(cat) => setSelectedCategory(cat)}
                  isLoading={isLoadingFeed}
                  isLoadingMore={isLoadingMore}
                  isRefreshing={isRefreshing}
                  error={feedError}
                  onRefresh={() => void refreshAllLive()}
                  onLoadMore={() =>
                    void loadFeed({
                      category: selectedCategory,
                      append: true,
                      startIndex: posts.length + 1,
                    })
                  }
                  onOpenPost={handleOpenPost}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={toggleBookmark}
                />
              )}

              {activeTab === 'categories' && (
                <CategoriesView
                  categories={categoryDirectory}
                  isLoadingDirectory={isLoadingDirectory}
                  directoryError={directoryError}
                  onRetryDirectory={() => void loadDirectory()}
                  onOpenPost={handleOpenPost}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={toggleBookmark}
                  refreshSignal={refreshSignal}
                />
              )}

              {activeTab === 'saved' && (
                <SavedView
                  bookmarks={bookmarks}
                  onRemoveBookmark={removeBookmark}
                  onClearBookmarks={clearBookmarks}
                  onOpenPost={handleOpenPost}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={toggleBookmark}
                  refreshSignal={refreshSignal}
                  onSynced={(date) => setLastUpdated(date)}
                />
              )}

              {activeTab === 'search' && (
                <SearchView
                  onOpenPost={handleOpenPost}
                  isBookmarked={isBookmarked}
                  onToggleBookmark={toggleBookmark}
                  refreshSignal={refreshSignal}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        savedCount={bookmarks.length}
      />
    </div>
  );
}
