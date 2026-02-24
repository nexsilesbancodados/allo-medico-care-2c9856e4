import { Skeleton } from "@/components/ui/skeleton";

/** Generic skeleton for lazy-loaded landing sections */
export const SectionSkeleton = () => (
  <div className="py-16 px-4">
    <div className="container mx-auto max-w-5xl space-y-6">
      <div className="text-center space-y-3">
        <Skeleton className="h-8 w-64 mx-auto" />
        <Skeleton className="h-4 w-96 mx-auto max-w-full" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

/** Skeleton for stats row */
export const StatsSkeleton = () => (
  <div className="py-8 px-4">
    <div className="container mx-auto flex justify-center gap-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center space-y-2">
          <Skeleton className="h-10 w-20 mx-auto" />
          <Skeleton className="h-3 w-24 mx-auto" />
        </div>
      ))}
    </div>
  </div>
);

/** Skeleton for testimonials */
export const TestimonialsSkeleton = () => (
  <div className="py-16 px-4">
    <div className="container mx-auto max-w-4xl space-y-6">
      <Skeleton className="h-8 w-48 mx-auto" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3 p-6 rounded-2xl border border-border/30">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default SectionSkeleton;
