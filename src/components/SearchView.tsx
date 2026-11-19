import React, { useEffect, useState } from 'react';
import { Clock, Search, X } from 'lucide-react';
import { isRtlLanguage } from '../data/languages';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { useTranslatedPosts } from '../hooks/useTranslatedPosts';
import { fetchLivePosts } from '../services/bloggerApi';
import { BlogPost } from '../types/blog';
import { ErrorState } from './ErrorState';
import { PostCard } from './PostCard';
import { PostListSkeleton } from './SkeletonCards';

interface SearchViewProps {
  onOpenPost: (post: BlogPost) => void;
  isBookmarked: (id: string, url?: string) => boolean;
  onToggleBookmark: (post: BlogPost) => void;
  refreshSignal: number;
  targetLang: string | null;
}

export function SearchView({
  onOpenPost,
  isBookmarked,
  onToggleBookmark,
  refreshSignal,
  targetLang,
}: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<BlogPost[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { recentSearches, addSearch, removeSearch, clearSearches } = useRecentSearches();
  const { displayPosts } = useTranslatedPosts(results, targetLang);
  const dir = isRtlLanguage(targetLang) ? 'rtl' : 'ltr';

  const openOriginalPost = (clicked: BlogPost) => {
    const original = results.find((p) => p.id === clicked.id) || clicked;
    onOpenPost(original);
  };

  const toggleOriginalBookmark = (clicked: BlogPost) => {
    const original = results.find((p) => p.id === clicked.id) || clicked;
    onToggleBookmark(original);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [query]);

  const executeSearch = async (searchTerm: string) => {
    if (!searchTerm) {
      setResults([]);
      setTotalResults(0);
      setError(null);
      return;
    }

    setIsSearching(true);
    setError(null);
    try {
      const res = await fetchLivePosts({
        query: searchTerm,
        startIndex: 1,
        maxResults: 20,
      });
      setResults(res.posts);
      setTotalResults(res.totalResults);
      addSearch(searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search request failed.');
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    void executeSearch(debouncedQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, refreshSignal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setDebouncedQuery(trimmed);
      void executeSearch(trimmed);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0F3D3E] dark:text-[#ECF2F2]">
            Search
          </h1>
          <p className="text-sm text-[#5B7C8A] dark:text-[#9BB3BD] mt-1">
            Query live articles directly from Muavexa
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <Search
            className="w-5 h-5 text-[#5B7C8A] dark:text-[#9BB3BD] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles, topics, or keywords..."
            aria-label="Search Muavexa articles"
            className="w-full h-13 pl-12 pr-12 rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] focus:border-[#177E70] dark:focus:border-[#BFE3D6] focus:outline-none text-sm sm:text-base text-[#111C1D] dark:text-[#ECF2F2] placeholder:text-[#7D97A2] dark:placeholder:text-[#6B848E] transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setDebouncedQuery('');
                setResults([]);
                setError(null);
              }}
              aria-label="Clear search query"
              className="min-h-[44px] min-w-[44px] flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 text-[#5B7C8A] hover:text-[#111C1D] dark:hover:text-[#ECF2F2] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>
      </div>

      {/* Recent Searches */}
      {!debouncedQuery && (
        <div className="space-y-4">
          {recentSearches.length > 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#5B7C8A] dark:text-[#9BB3BD]">
                  Recent Searches
                </span>
                <button
                  type="button"
                  onClick={clearSearches}
                  className="text-xs font-semibold text-[#177E70] dark:text-[#BFE3D6] hover:underline cursor-pointer min-h-[32px] px-2"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((item) => (
                  <div
                    key={item}
                    className="inline-flex items-center rounded-lg bg-[#F0F5F4] dark:bg-[#182628] border border-[#DCE6E5] dark:border-[#24363A]"
                  >
                    <button
                      type="button"
                      onClick={() => setQuery(item)}
                      className="min-h-[40px] pl-3 pr-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#0F3D3E] dark:text-[#ECF2F2] hover:text-[#177E70] dark:hover:text-[#BFE3D6] cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#5B7C8A]" />
                      <span>{item}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSearch(item)}
                      aria-label={`Remove ${item} from recent searches`}
                      className="min-h-[40px] min-w-[32px] pr-2 flex items-center justify-center text-[#5B7C8A] hover:text-[#111C1D] dark:hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] p-10 text-center">
              <Search className="w-8 h-8 text-[#5B7C8A] mx-auto mb-3" />
              <p className="font-serif text-lg font-semibold text-[#111C1D] dark:text-[#ECF2F2]">
                Search the live archive
              </p>
              <p className="text-sm text-[#5B7C8A] dark:text-[#9BB3BD] mt-1 max-w-md mx-auto">
                Enter keywords above to search titles and full article content directly from Muavexa.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Search Results */}
      {debouncedQuery && (
        <div className="space-y-4">
          {isSearching ? (
            <PostListSkeleton count={4} />
          ) : error ? (
            <ErrorState message={error} onRetry={() => void executeSearch(debouncedQuery)} />
          ) : results.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] p-10 text-center">
              <p className="font-serif text-lg font-semibold text-[#111C1D] dark:text-[#ECF2F2]">
                No matches for &ldquo;{debouncedQuery}&rdquo;
              </p>
              <p className="text-sm text-[#5B7C8A] dark:text-[#9BB3BD] mt-1">
                Try a different keyword or browse categories instead.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD] tabular-nums">
                {totalResults} {totalResults === 1 ? 'result' : 'results'} for &ldquo;
                {debouncedQuery}&rdquo;
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onOpenPost={openOriginalPost}
                    isBookmarked={isBookmarked(post.id, post.url)}
                    onToggleBookmark={toggleOriginalBookmark}
                    dir={dir}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
