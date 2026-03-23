import { motion } from "framer-motion";
import { memo } from "react";
import logo from "@/assets/logo.png";

const Bone = ({ className = "" }: { className?: string }) => (
  <div className={`shimmer-v2 rounded-xl ${className}`} aria-hidden="true" />
);

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

const DashboardSkeleton = () => (
  <motion.div
    variants={container} initial="hidden" animate="show"
    className="space-y-5 max-w-2xl mx-auto"
    role="status" aria-busy="true" aria-label="Carregando painel..."
  >
    {/* Loading indicator with Pingo logo */}
    <motion.div variants={item} className="flex items-center justify-center gap-3 py-3">
      <motion.img
        src={logo} alt="AloClínica" className="w-8 h-8 rounded-xl select-none"
        animate={{ rotate: [0, -8, 8, -8, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="flex gap-1">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40"
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
          />
        ))}
      </div>
      <span className="text-[11px] text-muted-foreground font-medium">Carregando...</span>
    </motion.div>

    {/* Hero banner skeleton */}
    <motion.div variants={item}>
      <div className="rounded-3xl overflow-hidden bg-primary/8 p-5 sm:p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Bone className="h-2.5 w-28" />
            <Bone className="h-7 w-48" />
            <Bone className="h-2.5 w-36" />
            <Bone className="h-6 w-28 rounded-2xl mt-2" />
          </div>
          <Bone className="h-9 w-9 rounded-xl shrink-0" />
        </div>
        <div className="flex gap-2 pt-1 overflow-hidden">
          {[0,1,2,3].map(i => (
            <div key={i} className="rounded-2xl p-2.5 space-y-1.5 min-w-[70px] bg-white/8 shrink-0">
              <Bone className="h-5 w-10 mx-auto" />
              <Bone className="h-2 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>

    {/* Wallet card skeleton */}
    <motion.div variants={item}>
      <div className="rounded-[22px] p-[18px] bg-primary/10 space-y-2">
        <Bone className="h-6 w-8 rounded-md" />
        <Bone className="h-4 w-40" />
        <Bone className="h-3 w-32 mt-2" />
        <div className="flex justify-between mt-2">
          <Bone className="h-3 w-20" />
          <Bone className="h-6 w-24 rounded-xl" />
        </div>
      </div>
    </motion.div>

    {/* Action pills row */}
    <motion.div variants={item}>
      <div className="flex gap-2 overflow-hidden">
        {[0,1,2,3,4].map(i => (
          <div key={i} className="flex items-center gap-2 p-2.5 rounded-3xl border border-border/30 bg-card/60 shrink-0">
            <Bone className="h-7 w-7 rounded-lg" />
            <Bone className="h-3 w-12" />
          </div>
        ))}
      </div>
    </motion.div>

    {/* Bento grid */}
    <motion.div variants={item}>
      <div className="grid grid-cols-2 gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} className="p-4 rounded-2xl border border-border/30 bg-card/60 space-y-2">
            <Bone className="h-9 w-9 rounded-xl" />
            <Bone className="h-7 w-20" />
            <Bone className="h-2.5 w-16" />
            <Bone className="h-5 w-14 rounded-lg" />
          </div>
        ))}
      </div>
    </motion.div>

    {/* List section */}
    <motion.div variants={item}>
      <div className="rounded-2xl border border-border/30 bg-card/60 overflow-hidden">
        <div className="p-4 border-b border-border/25 flex justify-between">
          <Bone className="h-4 w-28" />
          <Bone className="h-4 w-16" />
        </div>
        {[0,1,2].map(i => (
          <div key={i} className="flex items-center gap-3 p-4 border-b border-border/20 last:border-0">
            <Bone className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3.5 w-3/4" />
              <Bone className="h-2.5 w-1/2" />
            </div>
            <Bone className="h-7 w-16 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </motion.div>

    <span className="sr-only">Carregando dados do painel, por favor aguarde.</span>
  </motion.div>
);

export default memo(DashboardSkeleton);
