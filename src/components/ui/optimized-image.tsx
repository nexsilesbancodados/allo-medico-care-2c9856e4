import { useState, useRef, useEffect, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  priority?: boolean;
}

/**
 * Image with blur-up loading effect, error fallback, and intersection observer lazy loading.
 */
const OptimizedImage = ({
  className,
  fallback = "/placeholder.svg",
  alt,
  priority = false,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority || !imgRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  return (
    <img
      ref={imgRef}
      {...props}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "auto"}
      src={!inView ? undefined : error ? fallback : props.src}
      className={cn(
        "transition-all duration-500",
        loaded ? "opacity-100 blur-0 scale-100" : "opacity-0 blur-sm scale-[1.02]",
        className
      )}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setError(true);
        setLoaded(true);
        onError?.(e);
      }}
    />
  );
};

export default OptimizedImage;
