import { useEffect, useRef, useState } from "react";

interface UseAnimateInOptions {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
}

export const useAnimateIn = ({
  threshold = 0.12,
  rootMargin = "0px 0px -60px 0px",
  once = true,
}: UseAnimateInOptions = {}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
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
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
};
