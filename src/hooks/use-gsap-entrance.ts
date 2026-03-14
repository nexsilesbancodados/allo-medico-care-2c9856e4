import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface EntranceOptions {
  delay?: number;
  stagger?: number;
  y?: number;
  x?: number;
  scale?: number;
  duration?: number;
  scroll?: boolean;
  ease?: string;
}

/**
 * Staggered entrance animation for a container's children.
 * Usage: const ref = useGsapEntrance({ stagger: 0.08, scroll: true });
 */
export function useGsapEntrance({
  delay = 0, stagger = 0.06, y = 18, x = 0, scale = 1,
  duration = 0.48, scroll = false, ease = "power3.out",
}: EntranceOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targets = gsap.utils.toArray<Element>(el.children);
    if (!targets.length) return;

    gsap.set(targets, { opacity: 0, y, x, scale });

    const anim = {
      opacity: 1, y: 0, x: 0, scale: 1,
      duration, ease, stagger, delay, clearProps: "transform,opacity",
    };

    if (scroll) {
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: el, start: "top 85%", once: true,
          onEnter: () => gsap.to(targets, anim),
        });
      }, el);
      return () => ctx.revert();
    }
    const tw = gsap.to(targets, anim);
    return () => tw.kill();
  }, [delay, stagger, y, x, scale, duration, scroll, ease]);

  return ref;
}

/**
 * Single element fade+slide entrance.
 */
export function useGsapFadeIn({
  delay = 0, y = 16, duration = 0.42, scroll = false,
}: Omit<EntranceOptions, "stagger"> = {}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.set(el, { opacity: 0, y });
    const anim = { opacity: 1, y: 0, duration, ease: "power3.out", delay, clearProps: "transform,opacity" };

    if (scroll) {
      const ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: el, start: "top 88%", once: true,
          onEnter: () => gsap.to(el, anim),
        });
      }, el);
      return () => ctx.revert();
    }
    const tw = gsap.to(el, anim);
    return () => tw.kill();
  }, [delay, y, duration, scroll]);

  return ref;
}

/**
 * Animates a number from 0 → target inside a <span> ref.
 * Usage: const ref = useGsapCounter(1234);  <span ref={ref} />
 */
export function useGsapCounter(target: number, duration = 1.4, decimals = 0) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = decimals > 0 ? target.toFixed(decimals) : target.toLocaleString("pt-BR");
      return;
    }

    const obj = { val: 0 };
    const tw = gsap.to(obj, {
      val: target, duration, ease: "power2.out",
      onUpdate: () => {
        if (el) el.textContent = decimals > 0 ? obj.val.toFixed(decimals) : Math.round(obj.val).toLocaleString("pt-BR");
      },
    });
    return () => tw.kill();
  }, [target, duration, decimals]);

  return ref;
}

/**
 * Horizontal scroll marquee for the sidebar or stat bars.
 */
export function useGsapMarquee(speed = 40) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const clone = el.cloneNode(true) as HTMLElement;
    el.parentElement?.appendChild(clone);

    const tw = gsap.to([el, clone], {
      xPercent: -100,
      ease: "none",
      duration: speed,
      repeat: -1,
      modifiers: { xPercent: gsap.utils.wrap(-200, 0) },
    });
    return () => { tw.kill(); clone.remove(); };
  }, [speed]);

  return ref;
}
