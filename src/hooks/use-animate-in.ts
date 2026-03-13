import { useEffect, useRef, useState } from "react";

interface UseAnimateInOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

/**
 * Detects when an element enters the viewport and returns isVisible.
 * Automatically respects prefers-reduced-motion: if the user prefers
 * reduced motion, the element is immediately visible (no animation delay).
 */
export const useAnimateIn = ({
  threshold = 0.12,
  rootMargin = "0px 0px -60px 0px",
  once = true,
}: UseAnimateInOptions = {}) => {
  const ref = useRef<HTMLDivElement>(null);

  // Respect prefers-reduced-motion at hook level
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [isVisible, setIsVisible] = useState(prefersReduced);

  useEffect(() => {
    // If user prefers reduced motion, skip observer entirely
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once, prefersReduced]);

  return { ref, isVisible };
};
