import { logError } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getAdminNav } from "@/components/admin/adminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { MessageCircle, QrCode, RefreshCw, Wifi, WifiOff, Trash2, Plus, Smartphone } from "lucide-react";

interface Instance {
  instanceName: string;
  state?: string;
}

const AdminWhatsApp = () => {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [polling, setPolling] = useState(false);

  const callApi = async (action: string, instanceName?: string) => {
    const { data, error } = await supabase.functions.invoke("whatsapp-qr", {
      body: { action, instanceName },
    });
    if (error) throw error;
    return data;
  };

  const fetchInstances = useCallback(async () => {
    try {
      const res = await callApi("list");
      if (res?.success && Array.isArray(res.data)) {
        setInstances(res.data.map((i: any) => ({
          instanceName: i.instance?.instanceName || i.instanceName || "unknown",
          state: i.instance?.status || i.state || "unknown",
        })));
      }
    } catch (err) {
      logError("AdminWhatsApp fetch instances error", err);
    }
  }, []);

  useEffect(() => { fetchInstances(); }, [fetchInstances]);

  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error("Digite um nome para a instância");
      return;
    }
    setLoading(true);
    try {
      const res = await callApi("create", newInstanceName.trim());
      if (res?.success) {
        toast.success(`Instância "${newInstanceName}" criada!`);
        setNewInstanceName("");
        setSelectedInstance(res.instanceName || newInstanceName.trim());
        await fetchInstances();
        // Auto-fetch QR
        await getQrCode(res.instanceName || newInstanceName.trim());
      } else {
        toast.error("Erro ao criar instância");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar instância");
    } finally {
      setLoading(false);
    }
  };

  const getQrCode = async (name: string) => {
    setLoading(true);
    setQrCode(null);
    setSelectedInstance(name);
    try {
      const res = await callApi("qrcode", name);
      if (res?.success && res.data) {
        const base64 = res.data.base64 || res.data.qrcode?.base64 || null;
        const pairingCode = res.data.pairingCode || res.data.code || null;
        if (base64) {
          setQrCode(base64.startsWith("data:") ? base64 : `data:image/png;base64,${base64}`);
          setPolling(true);
        } else if (pairingCode) {
          setQrCode(null);
          setConnectionState("open");
          toast.success("Já conectado!");
          setPolling(false);
        } else {
          toast.info("Nenhum QR retornado. Verifique se já está conectado.");
        }
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao obter QR code");
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (name: string) => {
    try {
      const res = await callApi("status", name);
      if (res?.success) {
        const state = res.data?.instance?.state || res.data?.state || "unknown";
        setConnectionState(state);
        if (state === "open") {
          setPolling(false);
          setQrCode(null);
          toast.success("WhatsApp conectado!");
        }
        return state;
      }
    } catch (err) {
      logError("AdminWhatsApp status check error", err);
    }
    return null;
  };

  // Poll status when QR is showing
  useEffect(() => {
    if (!polling || !selectedInstance) return;
    const interval = setInterval(async () => {
      const state = await checkStatus(selectedInstance);
      if (state === "open") {
        clearInterval(interval);
        fetchInstances();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [polling, selectedInstance]);

  const deleteInstance = async (name: string) => {
    if (!confirm(`Excluir instância "${name}"?`)) return;
    try {
      await callApi("delete", name);
      toast.success("Instância excluída");
      if (selectedInstance === name) {
        setSelectedInstance(null);
        setQrCode(null);
        setConnectionState(null);
      }
      fetchInstances();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir");
    }
  };

  return (
    <DashboardLayout title="WhatsApp" nav={getAdminNav("whatsapp")}>
      <div className="w-full mx-auto max-w-4xl space-y-6 pb-24 md:pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <MessageCircle className="w-6 h-6 text-primary" />
            Conexão WhatsApp
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Conecte seu WhatsApp escaneando o QR Code para enviar notificações automáticas.
          </p>
        </div>

        {/* Create new instance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Instância
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Nome da instância (ex: clinica-principal)"
                value={newInstanceName}
                onChange={e => setNewInstanceName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createInstance()}
              />
              <Button onClick={createInstance} disabled={loading}>
                <Plus className="w-4 h-4 mr-1" />
                Criar
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Instances list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  Instâncias ({instances.length})
                </span>
                <Button size="sm" variant="ghost" onClick={fetchInstances}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {instances.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma instância criada ainda.
                </p>
              ) : (
                <div className="space-y-2">
                  {loading ? (
                Array.from({ length: 5 }).map((_, j) => (
                  <tr key={j} className="border-b border-border/30">
                                          <td key={j*4+0} className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
                      <td key={j*4+1} className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
                      <td key={j*4+2} className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
                      <td key={j*4+3} className="px-4 py-3"><div className="shimmer-v2 h-4 rounded" /></td>
                  </tr>
                ))
              ) : instances.map(inst => (
                    <div
                      key={inst.instanceName}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedInstance === inst.instanceName
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => {
                        setSelectedInstance(inst.instanceName);
                        checkStatus(inst.instanceName);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {inst.state === "open" ? (
                          <Wifi className="w-4 h-4 text-green-500" />
                        ) : (
                          <WifiOff className="w-4 h-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium text-foreground">{inst.instanceName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={inst.state === "open" ? "default" : "secondary"} className="text-xs">
                          {inst.state === "open" ? "Conectado" : inst.state || "—"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={e => { e.stopPropagation(); deleteInstance(inst.instanceName); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* QR Code panel */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
              {!selectedInstance ? (
                <div className="text-center text-muted-foreground">
                  <QrCode className="w-16 h-16 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">Selecione ou crie uma instância para gerar o QR Code</p>
                </div>
              ) : connectionState === "open" ? (
                <div className="text-center">
                  <Wifi className="w-16 h-16 mx-auto mb-3 text-green-500" />
                  <p className="text-sm font-medium text-foreground">WhatsApp Conectado!</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedInstance}</p>
                  <Button size="sm" variant="outline" className="mt-4" onClick={() => checkStatus(selectedInstance)}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Verificar Status
                  </Button>
                </div>
              ) : qrCode ? (
                <div className="text-center">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 mx-auto rounded-lg border border-border" loading="lazy" decoding="async" />
                  <p className="text-sm text-muted-foreground mt-3">Escaneie com o WhatsApp do seu celular</p>
                  {polling && (
                    <p className="text-xs text-primary mt-1 flex items-center justify-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Aguardando conexão...
                    </p>
                  )}
                  <Button size="sm" variant="outline" className="mt-3" onClick={() => getQrCode(selectedInstance)}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Novo QR
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">Instância: {selectedInstance}</p>
                  <Button onClick={() => getQrCode(selectedInstance)} disabled={loading}>
                    {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <QrCode className="w-4 h-4 mr-1" />}
                    Gerar QR Code
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminWhatsApp;
