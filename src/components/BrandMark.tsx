import React from 'react';

export function BrandMark({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="36" height="36" rx="9" fill="#0F3D3E" />
      <path
        d="M8.5 25V11L14.5 19.5L18 14.5L21.5 19.5L27.5 11V25"
        stroke="#BFE3D6"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="24.5" r="1.75" fill="#177E70" />
    </svg>
  );
}

export function BrandedCoverFallback({
  title,
  category,
}: {
  title: string;
  category?: string;
}) {
  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0F3D3E] via-[#124D4E] to-[#177E70] flex flex-col justify-between p-5 select-none">
      <svg
        className="absolute -right-8 -bottom-8 w-44 h-44 text-[#BFE3D6]/10 pointer-events-none"
        viewBox="0 0 120 120"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r="52" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="36" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M28 84V36L50 66L60 52L70 66L92 36V84"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <div className="relative flex items-center justify-between">
        <span className="text-[11px] font-medium tracking-wider uppercase text-[#BFE3D6]/90">
          {category || 'Muavexa'}
        </span>
        <BrandMark className="w-6 h-6 opacity-85" />
      </div>

      <p className="relative font-serif text-sm sm:text-base font-medium text-white/90 line-clamp-2 leading-snug max-w-[90%]">
        {title}
      </p>
    </div>
  );
}
