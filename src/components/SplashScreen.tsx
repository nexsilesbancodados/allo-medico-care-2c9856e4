import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mascotImg from "@/assets/mascot-wave.png";
import logoImg from "@/assets/logo.png";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [phase, setPhase] = useState<"enter" | "pulse" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("pulse"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(onFinish, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? null : null}
      <motion.div
        key="splash"
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-primary/10"
        initial={{ opacity: 1 }}
        animate={{ opacity: phase === "exit" ? 0 : 1 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {/* Decorative rings */}
        <motion.div
          className="absolute w-72 h-72 rounded-full border-2 border-primary/10"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: phase === "pulse" ? [1, 1.3, 1] : 1, opacity: phase === "enter" ? 0.6 : 0.3 }}
          transition={{ duration: 2, repeat: phase === "pulse" ? Infinity : 0, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute w-96 h-96 rounded-full border border-primary/5"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: phase === "pulse" ? [1, 1.2, 1] : 0.8, opacity: 0.2 }}
          transition={{ duration: 2.5, repeat: phase === "pulse" ? Infinity : 0, ease: "easeInOut", delay: 0.3 }}
        />

        {/* Mascot */}
        <motion.div
          className="relative z-10"
          initial={{ scale: 0, rotate: -20 }}
          animate={{
            scale: phase === "pulse" ? [1, 1.06, 1] : 1,
            rotate: 0,
            y: phase === "pulse" ? [0, -8, 0] : 0,
          }}
          transition={{
            scale: { duration: 1.5, repeat: phase === "pulse" ? Infinity : 0, ease: "easeInOut" },
            rotate: { duration: 0.5, type: "spring", stiffness: 200, damping: 12 },
            y: { duration: 1.5, repeat: phase === "pulse" ? Infinity : 0, ease: "easeInOut" },
          }}
        >
          <img
            src={mascotImg}
            alt="Pingo mascote"
            className="w-32 h-32 md:w-40 md:h-40 drop-shadow-xl object-contain"
          />
        </motion.div>

        {/* Logo */}
        <motion.img
          src={logoImg}
          alt="AloClinica"
          className="h-10 mt-6 object-contain"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        />

        {/* Loading dots */}
        <div className="flex gap-1.5 mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-primary"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          className="text-sm text-muted-foreground mt-4 font-medium tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          Sua saúde, a um clique
        </motion.p>
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
