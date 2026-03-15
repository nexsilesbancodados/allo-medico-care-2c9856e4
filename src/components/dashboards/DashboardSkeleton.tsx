import { motion } from "framer-motion";

const Bone = ({ className = "" }: { className?: string }) => (
  <div className={`shimmer-v2 rounded-xl ${className}`} aria-hidden="true" />
);

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/**
 * Premium dashboard skeleton — uses shimmer-v2 with staggered reveal.
 */
const DashboardSkeleton = () => (
  <motion.div
    variants={containerVariants}
    initial="hidden"
    animate="show"
    className="space-y-5 max-w-2xl mx-auto"
    role="status"
    aria-busy="true"
    aria-label="Carregando painel..."
  >
    {/* Hero card */}
    <motion.div variants={itemVariants}>
      <div className="rounded-2xl overflow-hidden" style={{ background: "hsl(var(--primary) / 0.08)" }}>
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Bone className="h-14 w-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Bone className="h-3 w-24" />
              <Bone className="h-6 w-48" />
              <Bone className="h-3 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-1">
            {[0,1,2].map(i => (
              <div key={i} className="rounded-xl p-3 space-y-2" style={{ background: "hsl(var(--primary) / 0.06)" }}>
                <Bone className="h-4 w-4 mx-auto rounded-lg" />
                <Bone className="h-6 w-8 mx-auto" />
                <Bone className="h-2.5 w-14 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>

    {/* Health metrics row */}
    <motion.div variants={itemVariants}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[0,1,2,3].map(i => (
          <div key={i} className="p-3 rounded-2xl border border-border/40 bg-card/50 space-y-2">
            <Bone className="h-5 w-5 rounded-lg" />
            <Bone className="h-6 w-16" />
            <Bone className="h-2.5 w-12" />
          </div>
        ))}
      </div>
    </motion.div>

    {/* Quick actions */}
    <motion.div variants={itemVariants}>
      <div className="grid grid-cols-4 gap-3">
        {[0,1,2,3].map(i => (
          <div key={i} className="flex flex-col items-center gap-2.5 p-3 rounded-2xl border border-border/40 bg-card/50">
            <Bone className="h-11 w-11 rounded-xl" />
            <Bone className="h-2.5 w-12" />
          </div>
        ))}
      </div>
    </motion.div>

    {/* Appointment card */}
    <motion.div variants={itemVariants}>
      <div className="p-4 rounded-2xl border border-border/40 bg-card/50 space-y-3">
        <div className="flex items-center gap-3">
          <Bone className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-1/2" />
          </div>
          <Bone className="h-8 w-20 rounded-xl shrink-0" />
        </div>
      </div>
    </motion.div>

    {/* List section */}
    <motion.div variants={itemVariants}>
      <div className="rounded-2xl border border-border/40 bg-card/50 overflow-hidden">
        <div className="p-4 border-b border-border/30">
          <Bone className="h-5 w-36" />
        </div>
        <div className="divide-y divide-border/30">
          {[0,1,2].map(i => (
            <div key={i} className="flex items-center gap-3 p-4">
              <Bone className="h-10 w-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-4 w-3/4" />
                <Bone className="h-3 w-1/2" />
              </div>
              <Bone className="h-6 w-16 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </motion.div>

    <span className="sr-only">Carregando dados do painel, por favor aguarde.</span>
  </motion.div>
);

import { memo } from "react";
export default memo(DashboardSkeleton);
