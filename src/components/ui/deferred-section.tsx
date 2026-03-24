import { PropsWithChildren, useEffect, useRef, useState } from "react";

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

  useEffect(() => {
    if (isVisible || typeof window === "undefined") return;

    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        setIsVisible(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible, rootMargin]);

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