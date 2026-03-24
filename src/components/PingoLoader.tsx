import { memo } from "react";
import mascotImg from "@/assets/mascot.png";

const PingoLoader = memo(() => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-5">
    {/* Mascot with bounce animation */}
    <div className="relative">
      {/* Soft glow behind mascot */}
      <div className="absolute inset-0 rounded-full bg-primary/10 blur-2xl scale-125 animate-pulse" />
      <img
        src={mascotImg}
        alt="Pingo carregando"
        className="relative w-20 h-20 md:w-24 md:h-24 object-contain drop-shadow-lg"
        style={{ animation: "pingo-bounce 1.8s ease-in-out infinite" }}
        draggable={false}
      />
    </div>

    {/* Loading dots */}
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full bg-primary/60"
          style={{
            animation: "pingo-dot 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>

    <p className="text-sm text-muted-foreground font-medium tracking-wide">
      Carregando AloClínica…
    </p>

    {/* Inline keyframes */}
    <style>{`
      @keyframes pingo-bounce {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-12px) scale(1.05); }
      }
      @keyframes pingo-dot {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1.2); }
      }
    `}</style>
  </div>
));

PingoLoader.displayName = "PingoLoader";
export default PingoLoader;
