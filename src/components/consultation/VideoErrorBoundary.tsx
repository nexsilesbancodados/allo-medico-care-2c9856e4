import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Phone } from "lucide-react";

interface Props {
  children: ReactNode;
  onEndCall?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class VideoErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[VideoErrorBoundary]", error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <Card className="max-w-md w-full border-destructive/30 bg-destructive/5">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Erro na Videochamada
              </h3>
              <p className="text-sm text-muted-foreground">
                Ocorreu um problema ao carregar a sala de vídeo. Isso pode ser causado por instabilidade na conexão ou bloqueio do navegador.
              </p>
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReload} className="w-full gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Recarregar Sala
                </Button>
                {this.props.onEndCall && (
                  <Button
                    variant="outline"
                    onClick={this.props.onEndCall}
                    className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                  >
                    <Phone className="w-4 h-4 rotate-[135deg]" />
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
