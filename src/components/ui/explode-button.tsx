import * as React from "react";
import { useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  decay: number;
  gravity: number;
  friction: number;
  size: number;
  color: string;
}

interface ExplodeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Colors used for particles – defaults to primary palette */
  particleColors?: string[];
  /** Delay (ms) before calling onClick after explosion starts */
  actionDelay?: number;
}

const ExplodeButton = React.forwardRef<HTMLButtonElement, ExplodeButtonProps>(
  ({ className, children, particleColors, actionDelay = 900, onClick, ...props }, ref) => {
    const btnRef = useRef<HTMLButtonElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const particlesRef = useRef<Particle[]>([]);
    const rafRef = useRef<number>(0);
    const isAnimating = useRef(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    // Merge forwarded ref
    const setRef = useCallback(
      (el: HTMLButtonElement | null) => {
        btnRef.current = el;
        if (typeof ref === "function") ref(el);
        else if (ref) (ref as React.MutableRefObject<HTMLButtonElement | null>).current = el;
      },
      [ref],
    );

    // Resize canvas to wrapper
    const syncCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const r = wrap.getBoundingClientRect();
      canvas.width = r.width + 120;
      canvas.height = r.height + 160;
      canvas.style.width = `${canvas.width}px`;
      canvas.style.height = `${canvas.height}px`;
      canvas.style.left = `-60px`;
      canvas.style.top = `-40px`;
    }, []);

    useEffect(() => {
      syncCanvas();
      window.addEventListener("resize", syncCanvas);
      return () => window.removeEventListener("resize", syncCanvas);
    }, [syncCanvas]);

    const createExplosion = useCallback(() => {
      const btn = btnRef.current;
      const wrap = wrapRef.current;
      if (!btn || !wrap) return;

      const btnRect = btn.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();

      const offsetX = btnRect.left - wrapRect.left + 60;
      const offsetY = btnRect.top - wrapRect.top + 40;

      const colors = particleColors ?? [
        "hsl(142,71%,45%)",  // primary green
        "hsl(142,71%,30%)",  // dark green
        "hsl(48,96%,53%)",   // gold accent
        "hsl(0,0%,100%)",    // white sparks
      ];

      const density = 5;
      const particles: Particle[] = [];

      for (let x = 0; x < btnRect.width; x += density) {
        for (let y = 0; y < btnRect.height; y += density) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 8 + 2;
          particles.push({
            x: offsetX + x,
            y: offsetY + y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            life: 1,
            decay: Math.random() * 0.018 + 0.008,
            gravity: 0.18,
            friction: 0.96,
            size: Math.random() * 3.5 + 1,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
      }
      particlesRef.current = particles;
    }, [particleColors]);

    const animate = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const ps = particlesRef.current;

      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        if (p.life <= 0) {
          ps.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (ps.length > 0) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        isAnimating.current = false;
        // Show button again
        if (btnRef.current) btnRef.current.style.visibility = "visible";
      }
    }, []);

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isAnimating.current) return;
        isAnimating.current = true;
        syncCanvas();
        createExplosion();

        // Hide button
        if (btnRef.current) btnRef.current.style.visibility = "hidden";

        rafRef.current = requestAnimationFrame(animate);

        // Fire original onClick after short delay
        if (onClick) {
          setTimeout(() => onClick(e), actionDelay);
        }
      },
      [onClick, actionDelay, createExplosion, animate, syncCanvas],
    );

    useEffect(() => {
      return () => cancelAnimationFrame(rafRef.current);
    }, []);

    return (
      <div ref={wrapRef} className="relative inline-flex">
        <canvas
          ref={canvasRef}
          className="pointer-events-none absolute z-20"
          aria-hidden="true"
        />
        <button
          ref={setRef}
          className={cn(
            "relative z-10 inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold ring-offset-background transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]",
            className,
          )}
          onClick={handleClick}
          {...props}
        >
          {children}
        </button>
      </div>
    );
  },
);
ExplodeButton.displayName = "ExplodeButton";

export { ExplodeButton };
