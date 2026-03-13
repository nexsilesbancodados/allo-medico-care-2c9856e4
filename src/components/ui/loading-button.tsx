import { forwardRef } from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  /** Accessible label for screen readers while loading */
  loadingAriaLabel?: string;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, loadingText, loadingAriaLabel, children, disabled, "aria-label": ariaLabel, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-label={loading ? (loadingAriaLabel ?? loadingText ?? ariaLabel) : ariaLabel}
        {...props}
      >
        {loading && (
          <Loader2
            className="w-4 h-4 mr-2 animate-spin shrink-0"
            aria-hidden="true"
          />
        )}
        {loading && loadingText ? loadingText : children}
      </Button>
    );
  }
);

LoadingButton.displayName = "LoadingButton";

export { LoadingButton };
