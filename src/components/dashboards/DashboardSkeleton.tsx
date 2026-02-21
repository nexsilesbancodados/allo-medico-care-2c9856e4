import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { motion } from "framer-motion";

/**
 * Reusable dashboard skeleton with animated KPI blobs, table rows, and chart placeholder.
 */
const DashboardSkeleton = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    {/* KPI blob row */}
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4 py-2">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-center" style={{ aspectRatio: "1/1", maxWidth: 180 }}>
          <div
            className="w-full h-full animate-pulse rounded-[40%_60%_55%_45%/55%_45%_55%_45%]"
            style={{
              background: `linear-gradient(155deg, hsl(var(--muted)) 0%, hsl(var(--muted)/0.5) 100%)`,
              animationDelay: `${i * 150}ms`,
            }}
          />
        </div>
      ))}
    </div>

    {/* Chart placeholder */}
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-48">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-muted/60 rounded-t-md animate-pulse"
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
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-xl">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  </motion.div>
);

export default DashboardSkeleton;
