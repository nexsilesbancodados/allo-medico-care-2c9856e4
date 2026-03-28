import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

const FormSection = ({ title, description, children, className }: FormSectionProps) => (
  <div className={cn("mb-6", className)}>
    <div className="mb-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</h3>
      {description && <p className="text-xs text-muted-foreground/70 mt-0.5">{description}</p>}
      <div className="mt-2 border-b border-border/30" />
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

export { FormSection };
export type { FormSectionProps };
