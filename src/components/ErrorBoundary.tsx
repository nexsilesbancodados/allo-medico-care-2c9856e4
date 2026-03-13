import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { logError } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError("ErrorBoundary — unhandled render error", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          className="min-h-screen flex items-center justify-center bg-background px-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Algo deu errado</h2>
            <p className="text-muted-foreground text-sm mb-2">
              Ocorreu um erro inesperado. Tente recarregar a página.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <pre className="text-left text-xs bg-muted rounded-lg p-3 mb-4 overflow-auto max-h-32 text-destructive">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <Button onClick={() => window.location.reload()} aria-label="Recarregar a página">
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Recarregar
              </Button>
              <Button
                variant="outline"
                onClick={() => { window.location.href = "/"; }}
                aria-label="Voltar para a página inicial"
              >
                <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                Início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
