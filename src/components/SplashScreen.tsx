import { useState, useEffect, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import logo from "@/assets/mascot.png";

const SplashScreen = memo(({ onFinish }: { onFinish: () => void }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), 1200);
    const t2 = setTimeout(onFinish, 1600);
    // Safety: force finish after 4s even if animations fail
    const safety = setTimeout(onFinish, 4000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(safety); };
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.img
            src={logo}
            alt="AloClinica"
            className="w-20 h-20 object-contain"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 16 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
});

SplashScreen.displayName = "SplashScreen";
export default SplashScreen;
