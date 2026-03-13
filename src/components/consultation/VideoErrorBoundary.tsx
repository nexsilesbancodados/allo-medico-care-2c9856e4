import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Phone } from "lucide-react";
import { logError } from "@/lib/logger";

interface Props {
  children: ReactNode;
  onEndCall?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class VideoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError("[VideoErrorBoundary] Render error in video consultation", error, {
      componentStack: errorInfo.componentStack,
    });
  }

  handleReload = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6" role="alert" aria-live="assertive">
          <Card className="max-w-md w-full border-destructive/30 bg-destructive/5">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Erro na Videochamada
              </h3>
              <p className="text-sm text-muted-foreground">
                Ocorreu um problema ao carregar a sala de vídeo. Isso pode ser causado por instabilidade na conexão ou bloqueio do navegador.
              </p>
              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground/70">
                  Tentativa {this.state.retryCount} de reconexão
                </p>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={this.handleReload}
                  className="w-full gap-2"
                  aria-label="Recarregar a sala de vídeo"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  Recarregar Sala
                </Button>
                {this.props.onEndCall && (
                  <Button
                    variant="outline"
                    onClick={this.props.onEndCall}
                    className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    aria-label="Encerrar a consulta"
                  >
                    <Phone className="w-4 h-4 rotate-[135deg]" aria-hidden="true" />
                    Encerrar Consulta
                  </Button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Dica: Verifique se o microfone e câmera estão permitidos no navegador.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default VideoErrorBoundary;
