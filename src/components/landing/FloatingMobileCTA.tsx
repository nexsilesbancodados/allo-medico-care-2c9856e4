import { useState, useEffect, forwardRef, useRef } from "react";
import { ArrowRight, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const FloatingMobileCTA = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (frameRef.current !== null) return;

      frameRef.current = window.requestAnimationFrame(() => {
        const nextVisible = window.scrollY > 480;
        setVisible((prevVisible) => (prevVisible === nextVisible ? prevVisible : nextVisible));
        frameRef.current = null;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  const openQuiz = () => {
    window.dispatchEvent(new CustomEvent("open-specialty-quiz"));
  };

  return (
    <div
      ref={ref}
      className={[
        "md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom,8px)+6px)] pt-2",
        "bg-gradient-to-t from-background via-background/95 to-transparent will-change-transform",
        "transition-transform duration-300 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0" : "translate-y-full pointer-events-none",
      ].join(" ")}
    >
      <div className="space-y-1.5 pointer-events-auto">
          <p className="text-[10px] text-center text-muted-foreground font-medium">
            🔥 <span className="text-warning font-bold">3 vagas</span> restantes para hoje
          </p>
          <div className="flex gap-2">
            <Button
              variant="rainbow"
              size="lg"
              className="flex-1 rounded-2xl h-12 text-sm font-bold gap-1.5"
              onClick={() => navigate("/paciente")}
            >
              <span className="relative z-10 flex items-center gap-1.5">
                Agendar Consulta <ArrowRight className="w-4 h-4" />
              </span>
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-2xl h-12 w-12 shrink-0 border-primary/30"
              onClick={openQuiz}
              aria-label="Triagem de especialidade"
            >
              <Stethoscope className="w-5 h-5 text-primary" />
            </Button>
          </div>
      </div>
    </div>
  );
});

FloatingMobileCTA.displayName = "FloatingMobileCTA";

export default FloatingMobileCTA;
