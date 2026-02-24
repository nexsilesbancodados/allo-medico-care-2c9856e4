import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import mascotImg from "@/assets/mascot-wave.png";

const SplashScreen = ({ onFinish }: { onFinish: () => void }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), 2200);
    const t2 = setTimeout(onFinish, 2700);
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
          transition={{ duration: 0.5 }}
        >
          <motion.img
            src={mascotImg}
            alt="Pingo mascote"
            className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl"
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0, y: [0, -10, 0] }}
            transition={{
              scale: { type: "spring", stiffness: 180, damping: 14 },
              rotate: { type: "spring", stiffness: 180, damping: 14 },
              y: { duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
