import React from 'react';

export function HomeFeedSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading latest articles">
      {/* Category bar skeleton */}
      <div className="flex items-center gap-2 overflow-hidden py-1">
        {[64, 92, 78, 104, 84].map((w, idx) => (
          <div
            key={idx}
            style={{ width: w }}
            className="h-9 rounded-lg bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer shrink-0"
          />
        ))}
      </div>

      {/* Hero skeleton */}
      <div className="rounded-2xl overflow-hidden bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31]">
        <div className="grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 aspect-[16/10] lg:aspect-auto lg:min-h-[340px] bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-center space-y-4">
            <div className="h-3.5 w-36 rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
            <div className="h-8 w-full rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
            <div className="h-8 w-4/5 rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
            <div className="h-4 w-full rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
            <div className="h-4 w-2/3 rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
          </div>
        </div>
      </div>

      {/* Grid cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="rounded-2xl overflow-hidden bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31]"
          >
            <div className="aspect-[4/3] bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
            <div className="p-5 space-y-3">
              <div className="h-3 w-40 rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
              <div className="h-6 w-full rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
              <div className="h-6 w-3/4 rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
              <div className="h-4 w-full rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CategoriesSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true">
      {Array.from({ length: 9 }).map((_, idx) => (
        <div
          key={idx}
          className="h-20 rounded-xl bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31] p-4 flex items-center justify-between"
        >
          <div className="space-y-2">
            <div className="h-4 w-28 rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
            <div className="h-3 w-16 rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
          </div>
          <div className="h-8 w-8 rounded-lg bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function PostListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-busy="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="rounded-2xl overflow-hidden bg-white dark:bg-[#131D20] border border-[#DCE6E5] dark:border-[#1E2E31]"
        >
          <div className="aspect-[4/3] bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
          <div className="p-5 space-y-3">
            <div className="h-3 w-36 rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
            <div className="h-6 w-full rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
            <div className="h-4 w-5/6 rounded bg-[#E4ECEB] dark:bg-[#182628] skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
