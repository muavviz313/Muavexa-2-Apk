import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'muavexa_recent_searches_v1';
const MAX_ITEMS = 8;

function readRecentSearches(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => readRecentSearches());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recentSearches));
    } catch {
      // Ignore storage errors
    }
  }, [recentSearches]);

  const addSearch = useCallback((query: string) => {
    const clean = query.trim();
    if (!clean) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      return [clean, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  const removeSearch = useCallback((query: string) => {
    setRecentSearches((prev) => prev.filter((item) => item !== query));
  }, []);

  const clearSearches = useCallback(() => {
    setRecentSearches([]);
  }, []);

  return {
    recentSearches,
    addSearch,
    removeSearch,
    clearSearches,
  };
}
