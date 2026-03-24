import { PropsWithChildren, useEffect, useRef, useState, useCallback } from "react";

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
  rootMargin = "320px 0px",
}: DeferredSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const heightRef = useRef<number | undefined>(undefined);

  // Capture the placeholder height before swapping to real content
  const captureHeight = useCallback(() => {
    if (containerRef.current && !isVisible) {
      heightRef.current = containerRef.current.getBoundingClientRect().height;
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
  }, [isVisible, rootMargin, captureHeight]);

  // After real content renders, clear the locked height so layout is natural
  useEffect(() => {
    if (!isVisible || !containerRef.current || !heightRef.current) return;
    const el = containerRef.current;
    // Lock height for one frame to prevent scroll jump
    el.style.minHeight = `${heightRef.current}px`;
    const raf = requestAnimationFrame(() => {
      el.style.minHeight = "";
    });
    return () => cancelAnimationFrame(raf);
  }, [isVisible]);

  return (
    <div ref={containerRef} className={className}>
      {isVisible ? (
        children
      ) : (
        <div
          aria-hidden="true"
          className={cn("w-full rounded-3xl bg-muted/20", fallbackClassName)}
        />
      )}
    </div>
  );
};

export default DeferredSection;