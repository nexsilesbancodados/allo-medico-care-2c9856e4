import React, { Component, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="py-6 flex flex-col items-center gap-3 text-center">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {this.props.fallbackTitle || "Erro ao carregar esta seção"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {this.state.error?.message?.slice(0, 100) || "Algo deu errado"}
              </p>
            </div>
            <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={this.handleRetry}>
              <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default SectionErrorBoundary;
