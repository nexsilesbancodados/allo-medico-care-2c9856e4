import { PropsWithChildren, Suspense, useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface DeferredSectionProps extends PropsWithChildren {
  className?: string;
  fallbackClassName?: string;
  rootMargin?: string;
}

const DeferredSection = ({
  children,
  className,
  fallbackClassName,
  rootMargin = "600px 0px",
}: DeferredSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const heightRef = useRef<number | undefined>(undefined);

  const fallbackNode = (
    <div
      aria-hidden="true"
      className={cn(
        "w-full rounded-3xl animate-pulse bg-muted/30",
        fallbackClassName
      )}
      style={{ minHeight: heightRef.current ?? 200 }}
    />
  );

  const captureHeight = useCallback(() => {
    if (!containerRef.current || isVisible) return;

    const nextHeight = containerRef.current.getBoundingClientRect().height;
    if (nextHeight > 0) {
      heightRef.current = nextHeight;
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible || typeof window === "undefined") return;

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        captureHeight();
        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [captureHeight, isVisible, rootMargin]);

  useEffect(() => {
    if (!isVisible || !containerRef.current || !heightRef.current) return;

    const el = containerRef.current;
    const lockedHeight = heightRef.current;
    let resizeObserver: ResizeObserver | null = null;

    el.style.minHeight = `${lockedHeight}px`;

    const releaseLock = () => {
      if (el.getBoundingClientRect().height >= lockedHeight - 1) {
        el.style.minHeight = "";
        resizeObserver?.disconnect();
      }
    };

    if (typeof ResizeObserver === "undefined") {
      const raf = requestAnimationFrame(() => {
        el.style.minHeight = "";
      });
      return () => cancelAnimationFrame(raf);
    }

    resizeObserver = new ResizeObserver(releaseLock);
    resizeObserver.observe(el);

    const raf = requestAnimationFrame(releaseLock);
    return () => {
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
    };
  }, [isVisible]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? <Suspense fallback={fallbackNode}>{children}</Suspense> : fallbackNode}
    </div>
  );
};

export default DeferredSection;
