import { useState, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
}

/**
 * Image with blur-up loading effect and error fallback.
 */
const OptimizedImage = ({ className, fallback = "/placeholder.svg", alt, onLoad, onError, ...props }: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <img
      {...props}
      alt={alt}
      loading="lazy"
      decoding="async"
      src={error ? fallback : props.src}
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
