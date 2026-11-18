import React, { useEffect, useRef, useState } from 'react';
import { BrandedCoverFallback } from './BrandMark';

interface PostThumbnailProps {
  src: string | null;
  alt: string;
  category?: string;
  className?: string;
  priority?: boolean;
}

export function PostThumbnail({
  src,
  alt,
  category,
  className = '',
  priority = false,
}: PostThumbnailProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    setHasError(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
    } else {
      setIsLoaded(false);
    }
  }, [src]);

  if (!src || hasError) {
    return (
      <div className={`w-full h-full ${className}`}>
        <BrandedCoverFallback title={alt} category={category} />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full h-full overflow-hidden bg-[#E5ECEB] dark:bg-[#172527] ${className}`}
    >
      {!isLoaded && <div className="absolute inset-0 skeleton-shimmer pointer-events-none" />}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
