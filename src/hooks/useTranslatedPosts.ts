import { useEffect, useState } from 'react';
import { translateManyTexts } from '../services/translateService';
import { BlogPost } from '../types/blog';

export function useTranslatedPosts(posts: BlogPost[], targetLang: string | null) {
  const [displayPosts, setDisplayPosts] = useState<BlogPost[]>(posts);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateError, setTranslateError] = useState<string | null>(null);

  useEffect(() => {
    if (!targetLang || targetLang === 'en' || posts.length === 0) {
      setDisplayPosts(posts);
      setIsTranslating(false);
      setTranslateError(null);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const run = async () => {
      setIsTranslating(true);
      setTranslateError(null);

      try {
        const titles = posts.map((p) => p.title);
        const excerpts = posts.map((p) => p.excerpt);
        const uniqueCategories = Array.from(
          new Set(posts.flatMap((p) => p.categories))
        );

        const [tTitles, tExcerpts, tCats] = await Promise.all([
          translateManyTexts(titles, targetLang, controller.signal, 4),
          translateManyTexts(excerpts, targetLang, controller.signal, 4),
          uniqueCategories.length > 0
            ? translateManyTexts(uniqueCategories, targetLang, controller.signal, 4)
            : Promise.resolve([]),
        ]);

        if (!active) return;

        const catMap = new Map<string, string>();
        uniqueCategories.forEach((orig, idx) => {
          catMap.set(orig, tCats[idx] || orig);
        });

        setDisplayPosts(
          posts.map((post, idx) => ({
            ...post,
            title: tTitles[idx] || post.title,
            excerpt: tExcerpts[idx] || post.excerpt,
            categories: post.categories.map((c) => catMap.get(c) || c),
          }))
        );
      } catch (err) {
        if (!active) return;
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setDisplayPosts(posts);
        setTranslateError(
          err instanceof Error ? err.message : 'Translation failed.'
        );
      } finally {
        if (active) {
          setIsTranslating(false);
        }
      }
    };

    void run();

    return () => {
      active = false;
      controller.abort();
    };
  }, [posts, targetLang]);

  return { displayPosts, isTranslating, translateError };
}
