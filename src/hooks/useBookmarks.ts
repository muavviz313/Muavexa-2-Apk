import { useCallback, useEffect, useState } from 'react';
import { BlogPost, BookmarkRef } from '../types/blog';

const STORAGE_KEY = 'muavexa_bookmarks_v1';

function readStoredBookmarks(): BookmarkRef[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is BookmarkRef =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.id === 'string' &&
        typeof item.url === 'string'
    );
  } catch {
    return [];
  }
}

function persistBookmarks(items: BookmarkRef[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkRef[]>(() => readStoredBookmarks());

  useEffect(() => {
    persistBookmarks(bookmarks);
  }, [bookmarks]);

  const isBookmarked = useCallback(
    (postId: string, postUrl?: string) =>
      bookmarks.some((b) => b.id === postId || (postUrl && b.url === postUrl)),
    [bookmarks]
  );

  const toggleBookmark = useCallback((post: Pick<BlogPost, 'id' | 'url'>) => {
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === post.id || b.url === post.url);
      if (exists) {
        return prev.filter((b) => b.id !== post.id && b.url !== post.url);
      }
      return [{ id: post.id, url: post.url, savedAt: Date.now() }, ...prev];
    });
  }, []);

  const removeBookmark = useCallback((id: string, url?: string) => {
    setBookmarks((prev) =>
      prev.filter((b) => b.id !== id && (!url || b.url !== url))
    );
  }, []);

  const clearBookmarks = useCallback(() => {
    setBookmarks([]);
  }, []);

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    clearBookmarks,
  };
}
