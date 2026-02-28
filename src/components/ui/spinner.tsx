import { cn } from "@/lib/utils";

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-4",
};

export const Spinner = ({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) => (
  <div className={cn("rounded-full animate-spin border-primary border-t-transparent", sizes[size], className)} />
);
