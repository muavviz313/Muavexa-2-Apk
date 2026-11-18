export type TabId = 'home' | 'categories' | 'saved' | 'search';

export type FontSizeOption = 'small' | 'medium' | 'large';

export interface BlogPost {
  id: string;
  numericId: string | null;
  title: string;
  url: string;
  publishedAt: string;
  updatedAt: string;
  formattedDate: string;
  authorName: string;
  categories: string[];
  thumbnailUrl: string | null;
  excerpt: string;
  sanitizedHtml: string;
  plainText: string;
  readingTimeMinutes: number;
}

export interface CategoryInfo {
  name: string;
  count: number;
}

export interface BookmarkRef {
  id: string;
  url: string;
  savedAt: number;
}

export interface FeedResponse {
  posts: BlogPost[];
  totalResults: number;
  allCategories: string[];
  fetchedAt: Date;
}
