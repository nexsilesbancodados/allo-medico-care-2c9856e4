import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";

/**
 * Reusable dashboard skeleton with shimmer effect, KPI cards, chart and table placeholders.
 * Announces loading state to screen readers via aria-busy and aria-label.
 */
const ShimmerBlock = ({ className = "" }: { className?: string }) => (
  <div className={`skeleton-shimmer rounded-2xl ${className}`} aria-hidden="true" />
);

const DashboardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
    className="space-y-6 max-w-4xl"
    role="status"
    aria-busy="true"
    aria-label="Carregando painel..."
  >
    {/* Greeting skeleton */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <ShimmerBlock className="h-7 w-48" />
        <ShimmerBlock className="h-4 w-32" />
      </div>
      <ShimmerBlock className="h-9 w-9 rounded-xl" />
    </div>

    {/* KPI cards */}
    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="p-4 rounded-2xl border border-border/30 bg-card/50 space-y-3">
          <div className="flex items-center gap-2">
            <ShimmerBlock className="h-4 w-4 rounded-lg" />
            <ShimmerBlock className="h-3 w-16" />
          </div>
          <ShimmerBlock className="h-8 w-12" />
        </div>
      ))}
    </div>

    {/* Quick actions */}
    <div className="grid grid-cols-4 gap-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border border-border/30 bg-card/50">
          <ShimmerBlock className="h-11 w-11 rounded-xl" />
          <ShimmerBlock className="h-3 w-12" />
        </div>
      ))}
    </div>

    {/* Chart placeholder */}
    <Card className="border-border/40 overflow-hidden">
      <CardHeader className="pb-3">
        <ShimmerBlock className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1.5 h-44">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 skeleton-shimmer rounded-t-lg"
              style={{
                height: `${20 + Math.random() * 70}%`,
                animationDelay: `${i * 80}ms`,
              }}
            />
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Table rows */}
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <ShimmerBlock className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl">
            <ShimmerBlock className="h-10 w-10 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <ShimmerBlock className="h-4 w-3/4" />
              <ShimmerBlock className="h-3 w-1/2" />
            </div>
            <ShimmerBlock className="h-6 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>

    {/* Visually hidden text for screen readers */}
    <span className="sr-only">Carregando dados do painel, por favor aguarde.</span>
  </motion.div>
);

export default DashboardSkeleton;
