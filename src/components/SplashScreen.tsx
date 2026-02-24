import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mascotImg from "@/assets/mascot-wave.png";

const SplashScreen = memo(({ onFinish }: { onFinish: () => void }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Preload critical hero images during splash screen
    const preloadImages = [
      new URL("@/assets/hero-doctor.png", import.meta.url).href,
      new URL("@/assets/logo.png", import.meta.url).href,
    ];
    preloadImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const t1 = setTimeout(() => setVisible(false), 1800);
    const t2 = setTimeout(onFinish, 2300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.img
            src={mascotImg}
            alt="Pingo mascote"
            className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0, y: [0, -10, 0] }}
            transition={{
              scale: { type: "spring", stiffness: 200, damping: 16 },
              rotate: { type: "spring", stiffness: 200, damping: 16 },
              y: { duration: 1.2, repeat: Infinity, ease: "easeInOut", delay: 0.4 },
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SplashScreen.displayName = "SplashScreen";

export default SplashScreen;
