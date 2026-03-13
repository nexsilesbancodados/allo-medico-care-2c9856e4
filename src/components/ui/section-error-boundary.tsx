import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { logError } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  /** Max retries before giving up and showing a permanent error */
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

class SectionErrorBoundary extends Component<Props, State> {
  static defaultProps = { maxRetries: 3 };

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError("SectionErrorBoundary caught error", error, {
      componentStack: errorInfo.componentStack,
      fallbackTitle: this.props.fallbackTitle,
    });
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    if (this.state.retryCount >= maxRetries) return;
    this.setState(prev => ({
      hasError: false,
      error: undefined,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    const { hasError, error, retryCount } = this.state;
    const { fallbackTitle, maxRetries = 3 } = this.props;
    const exhausted = retryCount >= maxRetries;

    if (hasError) {
      return (
        <Card className="border-destructive/20 bg-destructive/5" role="alert" aria-live="assertive">
          <CardContent className="py-6 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {fallbackTitle || "Erro ao carregar esta seção"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {exhausted
                  ? "Recarregue a página para continuar."
                  : (error?.message?.slice(0, 120) || "Algo deu errado")}
              </p>
              {!exhausted && retryCount > 0 && (
                <p className="text-[11px] text-muted-foreground/60 mt-1">
                  Tentativa {retryCount} de {maxRetries}
                </p>
              )}
            </div>
            {!exhausted ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                onClick={this.handleRetry}
                aria-label="Tentar carregar a seção novamente"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Tentar novamente
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                onClick={() => window.location.reload()}
                aria-label="Recarregar a página"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                Recarregar página
              </Button>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
