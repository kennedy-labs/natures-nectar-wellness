"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SkeletonImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  useNextImage?: boolean;
  priority?: boolean;
};

export function SkeletonImage({
  src,
  alt,
  className,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  useNextImage = false,
  priority = false,
}: SkeletonImageProps) {
  const isDataUri = src.startsWith("data:");
  const isInternalMediaApi = src.startsWith("/api/media/");
  const shouldUseNextImage = useNextImage && !isDataUri && !isInternalMediaApi;
  const [loaded, setLoaded] = useState(isDataUri);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (isDataUri) return;
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [isDataUri, src]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {!loaded ? (
        <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      ) : null}

      {shouldUseNextImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          referrerPolicy="no-referrer"
          className={cn("relative z-10 h-full w-full object-cover", className)}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          referrerPolicy="no-referrer"
          className={cn("relative z-10 h-full w-full object-cover", className)}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
    </div>
  );
}
