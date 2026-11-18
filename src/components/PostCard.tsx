import React from 'react';
import { ArrowUpRight, Bookmark } from 'lucide-react';
import { BlogPost } from '../types/blog';
import { PostThumbnail } from './PostThumbnail';

interface PostCardProps {
  post: BlogPost;
  onOpenPost: (post: BlogPost) => void;
  isBookmarked: boolean;
  onToggleBookmark: (post: BlogPost) => void;
  onCategoryClick?: (category: string) => void;
}

export function FeaturedHeroPost({
  post,
  onOpenPost,
  isBookmarked,
  onToggleBookmark,
  onCategoryClick,
}: PostCardProps) {
  const primaryCategory = post.categories[0] || 'Latest';

  return (
    <article className="group rounded-2xl overflow-hidden bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] transition-colors">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        <button
          type="button"
          onClick={() => onOpenPost(post)}
          className="lg:col-span-7 relative block aspect-[16/10] lg:aspect-auto lg:min-h-[360px] w-full overflow-hidden text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#177E70]"
          aria-label={`Read featured article: ${post.title}`}
        >
          <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.02]">
            <PostThumbnail
              src={post.thumbnailUrl}
              alt={post.title}
              category={primaryCategory}
              priority
            />
          </div>
        </button>

        <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-5">
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD]">
              {onCategoryClick && post.categories[0] ? (
                <button
                  type="button"
                  onClick={() => onCategoryClick(post.categories[0])}
                  className="text-[#177E70] dark:text-[#BFE3D6] font-semibold hover:underline underline-offset-4 cursor-pointer"
                >
                  {primaryCategory}
                </button>
              ) : (
                <span className="text-[#177E70] dark:text-[#BFE3D6] font-semibold">
                  {primaryCategory}
                </span>
              )}
              {post.formattedDate && (
                <>
                  <span aria-hidden="true">·</span>
                  <time dateTime={post.publishedAt}>{post.formattedDate}</time>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{post.readingTimeMinutes} min read</span>
            </div>

            <button
              type="button"
              onClick={() => onOpenPost(post)}
              className="block text-left cursor-pointer group/title"
            >
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold leading-tight text-[#0F3D3E] dark:text-[#ECF2F2] group-hover/title:text-[#177E70] dark:group-hover/title:text-[#BFE3D6] transition-colors">
                {post.title}
              </h2>
            </button>

            {post.excerpt && (
              <p className="text-sm sm:text-[15px] text-[#4A6570] dark:text-[#A9BDC5] leading-relaxed line-clamp-3">
                {post.excerpt}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#EBF1F0] dark:border-[#1E2E31]">
            <button
              type="button"
              onClick={() => onOpenPost(post)}
              className="inline-flex items-center gap-1.5 min-h-[44px] pr-3 text-sm font-semibold text-[#0F3D3E] dark:text-[#BFE3D6] hover:text-[#177E70] dark:hover:text-white transition-colors cursor-pointer"
            >
              <span>Read article</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => onToggleBookmark(post)}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
              aria-pressed={isBookmarked}
              className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
                isBookmarked
                  ? 'text-[#177E70] dark:text-[#BFE3D6] bg-[#BFE3D6]/30 dark:bg-[#177E70]/25'
                  : 'text-[#5B7C8A] dark:text-[#9BB3BD] hover:bg-[#EDF3F2] dark:hover:bg-[#19282B]'
              }`}
            >
              <Bookmark className="w-[18px] h-[18px]" fill={isBookmarked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export function PostCard({
  post,
  onOpenPost,
  isBookmarked,
  onToggleBookmark,
  onCategoryClick,
}: PostCardProps) {
  const primaryCategory = post.categories[0] || 'Article';

  return (
    <article className="group flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] transition-colors">
      <button
        type="button"
        onClick={() => onOpenPost(post)}
        className="relative block aspect-[4/3] w-full overflow-hidden text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#177E70]"
        aria-label={`Read article: ${post.title}`}
      >
        <div className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
          <PostThumbnail
            src={post.thumbnailUrl}
            alt={post.title}
            category={primaryCategory}
          />
        </div>
      </button>

      <div className="flex-1 p-5 flex flex-col justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-medium text-[#5B7C8A] dark:text-[#9BB3BD]">
            {onCategoryClick && post.categories[0] ? (
              <button
                type="button"
                onClick={() => onCategoryClick(post.categories[0])}
                className="text-[#177E70] dark:text-[#BFE3D6] font-semibold hover:underline underline-offset-4 cursor-pointer"
              >
                {primaryCategory}
              </button>
            ) : (
              <span className="text-[#177E70] dark:text-[#BFE3D6] font-semibold">
                {primaryCategory}
              </span>
            )}
            {post.formattedDate && (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={post.publishedAt}>{post.formattedDate}</time>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{post.readingTimeMinutes} min read</span>
          </div>

          <button
            type="button"
            onClick={() => onOpenPost(post)}
            className="block text-left cursor-pointer"
          >
            <h3 className="font-serif text-lg sm:text-[19px] font-semibold leading-snug text-[#111C1D] dark:text-[#ECF2F2] group-hover:text-[#177E70] dark:group-hover:text-[#BFE3D6] transition-colors line-clamp-2">
              {post.title}
            </h3>
          </button>

          {post.excerpt && (
            <p className="text-sm text-[#4A6570] dark:text-[#A2B7BF] leading-relaxed line-clamp-2">
              {post.excerpt}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-[#EBF1F0] dark:border-[#1E2E31]">
          <button
            type="button"
            onClick={() => onOpenPost(post)}
            className="min-h-[44px] pr-3 inline-flex items-center gap-1 text-xs font-semibold text-[#0F3D3E] dark:text-[#BFE3D6] hover:text-[#177E70] dark:hover:text-white transition-colors cursor-pointer"
          >
            <span>Read more</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onToggleBookmark(post)}
            aria-label={isBookmarked ? 'Remove bookmark' : 'Save bookmark'}
            aria-pressed={isBookmarked}
            className={`min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
              isBookmarked
                ? 'text-[#177E70] dark:text-[#BFE3D6] bg-[#BFE3D6]/30 dark:bg-[#177E70]/25'
                : 'text-[#5B7C8A] dark:text-[#9BB3BD] hover:bg-[#EDF3F2] dark:hover:bg-[#19282B]'
            }`}
          >
            <Bookmark className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>
    </article>
  );
}
