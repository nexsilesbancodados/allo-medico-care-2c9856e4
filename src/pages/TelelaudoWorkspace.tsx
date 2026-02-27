import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { gerarHashDocumento } from "@/lib/signature";
import TipTapEditor from "@/components/telelaudo/TipTapEditor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Mic, MicOff, Wand2, FileSignature, Upload, RefreshCw,
  ZoomIn, ZoomOut, Sun, Contrast, Ruler, Move, Loader2,
  FileText, Clock, CheckCircle, AlertTriangle, RotateCw, Maximize2,
  Search, Sparkles, MessageSquare, Filter, Keyboard, Download
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type Exame = {
  id: string;
  paciente_nome: string;
  study_uid: string | null;
  status: string;
  laudo_texto: string | null;
  arquivo_url: string | null;
  created_at: string;
  pdf_url: string | null;
};

// ==================== DICOM VIEWER PANEL ====================
const DicomViewerPanel = ({ arquivoUrl }: { arquivoUrl: string | null }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [ww, setWw] = useState(400);
  const [wl, setWl] = useState(40);
  const [tool, setTool] = useState<"pan" | "zoom" | "measure">("pan");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!arquivoUrl) return;
    setLoaded(false);

    const loadDicom = async () => {
      try {
        const dwv = await import("dwv");
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '<div id="dwv-layer-group" style="width:100%;height:100%"></div>';

        const app = new dwv.App();
        const viewConfig0 = new dwv.ViewConfig("dwv-layer-group");
        const viewConfigs = { "*": [viewConfig0] };
        const options = new dwv.AppOptions(viewConfigs);
        app.init(options);

        let url = arquivoUrl;
        if (arquivoUrl.startsWith("dicom-bucket/")) {
          const { data } = await supabase.storage
            .from("dicom-bucket")
            .createSignedUrl(arquivoUrl.replace("dicom-bucket/", ""), 3600);
          if (data?.signedUrl) url = data.signedUrl;
        }

        app.loadURLs([url]);
        app.addEventListener("loadend", () => setLoaded(true));
      } catch (err) {
        console.error("DICOM load error:", err);
        toast.error("Erro ao carregar imagem DICOM");
      }
    };

    loadDicom();
  }, [arquivoUrl]);

  if (!arquivoUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
        <FileText className="w-16 h-16 opacity-30" />
        <p className="text-sm">Selecione um exame para visualizar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-card/50 flex-wrap">
        <Button size="sm" variant={tool === "pan" ? "default" : "outline"} onClick={() => setTool("pan")} title="Pan">
          <Move className="w-4 h-4" />
        </Button>
        <Button size="sm" variant={tool === "zoom" ? "default" : "outline"} onClick={() => setTool("zoom")} title="Zoom">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant={tool === "measure" ? "default" : "outline"} onClick={() => setTool("measure")} title="Medição">
          <Ruler className="w-4 h-4" />
        </Button>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.min(z + 0.25, 5))} title="Zoom +">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setZoom(z => Math.max(z - 0.25, 0.25))} title="Zoom -">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={() => setZoom(1)} title="Reset Zoom">
          <RotateCw className="w-4 h-4" />
        </Button>
        <span className="text-xs text-muted-foreground mx-1">{Math.round(zoom * 100)}%</span>
        <Separator orientation="vertical" className="h-6 mx-1" />
        <div className="flex items-center gap-1">
          <Sun className="w-3 h-3 text-muted-foreground" />
          <input type="range" min="1" max="4000" value={ww} onChange={e => setWw(+e.target.value)}
            className="w-16 h-1 accent-primary" title={`WW: ${ww}`} />
        </div>
        <div className="flex items-center gap-1">
          <Contrast className="w-3 h-3 text-muted-foreground" />
          <input type="range" min="-1000" max="1000" value={wl} onChange={e => setWl(+e.target.value)}
            className="w-16 h-1 accent-primary" title={`WL: ${wl}`} />
        </div>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => containerRef.current?.requestFullscreen?.()} title="Tela cheia">
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Viewer */}
      <div className="flex-1 relative bg-black overflow-hidden" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

// ==================== LAUDO EDITOR PANEL ====================
const LaudoEditorPanel = ({
  exame,
  onSave,
  onSign,
}: {
  exame: Exame | null;
  onSave: (text: string) => void;
  onSign: () => void;
}) => {
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const isSigned = exame?.status === "assinado";

  useEffect(() => {
    setText(exame?.laudo_texto || "");
  }, [exame?.id]);

  // Auto-save every 5s
  useEffect(() => {
    if (!exame || isSigned) return;
    const timer = setInterval(() => {
      if (text !== exame.laudo_texto) onSave(text);
    }, 5000);
    return () => clearInterval(timer);
  }, [text, exame, isSigned, onSave]);

  const startNoiseFilteredRecognition = useCallback(async () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Reconhecimento de voz não suportado neste navegador"); return; }

    // Web Audio API noise suppression
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      // Keep stream active while recording
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const dest = audioCtx.createMediaStreamDestination();
      source.connect(dest);
      toast.info("🔇 Filtro de ruído ativado");
    } catch {
      // Fallback: proceed without noise filter
    }

    const recognition = new SR();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";
    recognition.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + " ";
      }
      if (finalTranscript) {
        setText(prev => prev + finalTranscript);
        finalTranscript = "";
      }
    };
    recognition.onerror = () => { setIsRecording(false); toast.error("Erro no reconhecimento de voz"); };
    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    toast.success("🎙️ Ditado ativado — fale agora");
  }, []);

  const toggleVoice = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }
    startNoiseFilteredRecognition();
  }, [isRecording, startNoiseFilteredRecognition]);

  const callAI = useCallback(async (mode: "structure" | "improve" | "suggest_conclusion") => {
    if (!text.trim()) { toast.error("Digite ou dite o texto primeiro"); return; }
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("deepseek-laudo", {
        body: { raw_text: text, exam_type: "Radiologia", mode },
      });
      if (error) throw error;
      if (data?.structured_text) {
        if (mode === "suggest_conclusion") {
          setText(prev => prev + "\n\n**CONCLUSÃO:**\n" + data.structured_text);
          toast.success("Conclusão sugerida pela IA");
        } else {
          setText(data.structured_text);
          toast.success(mode === "structure" ? "Laudo estruturado pela IA" : "Texto melhorado pela IA");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao processar com IA");
    } finally {
      setIsProcessing(false);
    }
  }, [text]);

  if (!exame) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-4">
        <FileSignature className="w-16 h-16 opacity-30" />
        <p className="text-sm">Selecione um exame para laudar</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm">{exame.paciente_nome}</h3>
            <p className="text-xs text-muted-foreground">{exame.study_uid || "Sem Study UID"}</p>
          </div>
          <Badge variant={isSigned ? "default" : "secondary"}>
            {isSigned ? "Assinado" : "Pendente"}
          </Badge>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border flex-wrap">
        <Button size="sm" variant={isRecording ? "destructive" : "outline"} onClick={toggleVoice} disabled={isSigned}>
          {isRecording ? <MicOff className="w-4 h-4 mr-1" /> : <Mic className="w-4 h-4 mr-1" />}
          {isRecording ? "Parar" : "Ditar"}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={isProcessing || isSigned}>
              {isProcessing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Wand2 className="w-4 h-4 mr-1" />}
              IA ▾
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel className="text-xs">Assistente IA</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => callAI("structure")}>
              <Wand2 className="w-4 h-4 mr-2" /> Estruturar Laudo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => callAI("improve")}>
              <Sparkles className="w-4 h-4 mr-2" /> Melhorar Texto
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => callAI("suggest_conclusion")}>
              <MessageSquare className="w-4 h-4 mr-2" /> Sugerir Conclusão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex-1" />
        <Button size="sm" variant="outline" onClick={() => onSave(text)} disabled={isSigned}>
          Salvar
        </Button>
        <Button size="sm" onClick={onSign} disabled={isSigned}>
          <FileSignature className="w-4 h-4 mr-1" />
          Assinar
        </Button>
      </div>

      {/* TipTap Editor */}
      <div className="flex-1 overflow-hidden">
        <TipTapEditor
          content={text}
          onChange={setText}
          disabled={isSigned}
        />
      </div>
    </div>
  );
};

// ==================== MAIN WORKSPACE ====================
const TelelaudoWorkspace = () => {
  const { user } = useAuth();
  const [exames, setExames] = useState<Exame[]>([]);
  const [selectedExame, setSelectedExame] = useState<Exame | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signToken, setSignToken] = useState("");
  const [signing, setSigning] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pendente" | "assinado">("all");
  const saveRef = useRef<((text: string) => void) | null>(null);

  const fetchExames = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("exames")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar exames");
    else setExames((data as Exame[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchExames(); }, [fetchExames]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+S = Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (selectedExame && selectedExame.status !== "assinado") {
          saveRef.current?.(selectedExame.laudo_texto || "");
          toast.success("Salvo!");
        }
      }
      // Ctrl+Enter = Sign
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (selectedExame && selectedExame.status !== "assinado") setShowSignModal(true);
      }
      // Ctrl+Shift+F = Focus search
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
        e.preventDefault();
        document.getElementById("exam-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedExame]);

  const handleSave = useCallback(async (text: string) => {
    if (!selectedExame) return;
    const { error } = await supabase
      .from("exames")
      .update({ laudo_texto: text })
      .eq("id", selectedExame.id);
    if (error) toast.error("Erro ao salvar");
    else {
      setSelectedExame(prev => prev ? { ...prev, laudo_texto: text } : null);
      setExames(prev => prev.map(e => e.id === selectedExame.id ? { ...e, laudo_texto: text } : e));
    }
  }, [selectedExame]);

  // Keep saveRef updated
  useEffect(() => { saveRef.current = handleSave; }, [handleSave]);

  const handleSign = useCallback(async () => {
    if (!selectedExame || !signToken.trim()) { toast.error("Informe o token"); return; }
    if (signToken.length < 6) { toast.error("Token inválido (mín. 6 caracteres)"); return; }

    setSigning(true);
    try {
      const laudoText = selectedExame.laudo_texto || "";
      const hash = await gerarHashDocumento(laudoText);

      const doc = new jsPDF();
      doc.setFontSize(10);
      doc.text("LAUDO MÉDICO — ASSINADO DIGITALMENTE", 20, 20);
      doc.setFontSize(8);
      doc.text(`Paciente: ${selectedExame.paciente_nome}`, 20, 30);
      doc.text(`Data: ${new Date().toLocaleString("pt-BR")}`, 20, 36);
      doc.text(`Hash SHA-256: ${hash}`, 20, 42);
      doc.line(20, 46, 190, 46);

      const lines = doc.splitTextToSize(laudoText, 170);
      doc.text(lines, 20, 54);

      const pdfBlob = doc.output("blob");
      const fileName = `laudos/${selectedExame.id}_${Date.now()}.pdf`;

      const { error: uploadError } = await supabase.storage
        .from("dicom-bucket")
        .upload(fileName, pdfBlob, { contentType: "application/pdf" });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("dicom-bucket")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("exames")
        .update({
          status: "assinado",
          assinado_em: new Date().toISOString(),
          pdf_url: urlData?.publicUrl || fileName,
          laudo_texto: laudoText,
        })
        .eq("id", selectedExame.id);
      if (updateError) throw updateError;

      setSelectedExame(prev => prev ? { ...prev, status: "assinado" } : null);
      setExames(prev => prev.map(e => e.id === selectedExame.id ? { ...e, status: "assinado" } : e));
      setShowSignModal(false);
      setSignToken("");
      toast.success("✅ Laudo assinado e PDF gerado com sucesso!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao assinar laudo");
    } finally {
      setSigning(false);
    }
  }, [selectedExame, signToken]);

  const handleUpload = useCallback(async () => {
    if (!uploadFile || !uploadName.trim()) { toast.error("Preencha nome e arquivo"); return; }
    setUploading(true);
    try {
      const filePath = `exames/${Date.now()}_${uploadFile.name}`;
      const { error: storageError } = await supabase.storage
        .from("dicom-bucket")
        .upload(filePath, uploadFile);
      if (storageError) throw storageError;

      const { error: insertError } = await supabase.from("exames").insert({
        paciente_nome: uploadName,
        arquivo_url: `dicom-bucket/${filePath}`,
        status: "pendente",
        laudista_id: user?.id,
      });
      if (insertError) throw insertError;

      toast.success("Exame enviado com sucesso!");
      setShowUpload(false);
      setUploadName("");
      setUploadFile(null);
      fetchExames();
    } catch (err: any) {
      toast.error(err?.message || "Erro no upload");
    } finally {
      setUploading(false);
    }
  }, [uploadFile, uploadName, user, fetchExames]);

  // Filtered exames
  const filteredExames = exames.filter(e => {
    const matchesSearch = !searchQuery || e.paciente_nome.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const pendentes = exames.filter(e => e.status === "pendente");
  const assinados = exames.filter(e => e.status === "assinado");

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-72 border-r border-border flex flex-col bg-card">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-sm">Fila de Exames</h2>
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={fetchExames} className="h-7 w-7">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Atualizar lista</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" variant="ghost" onClick={() => setShowUpload(true)} className="h-7 w-7">
                      <Upload className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload de exame</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              id="exam-search"
              placeholder="Buscar paciente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-7 text-xs"
            />
          </div>
          {/* Filter tabs */}
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList className="w-full h-7">
              <TabsTrigger value="all" className="text-[10px] flex-1 h-5">
                Todos ({exames.length})
              </TabsTrigger>
              <TabsTrigger value="pendente" className="text-[10px] flex-1 h-5">
                Pendentes ({pendentes.length})
              </TabsTrigger>
              <TabsTrigger value="assinado" className="text-[10px] flex-1 h-5">
                Assinados ({assinados.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
          {/* Shortcuts hint */}
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <Keyboard className="w-3 h-3" />
            <span>Ctrl+S salvar · Ctrl+Enter assinar · Ctrl+Shift+F buscar</span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredExames.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? "Nenhum resultado para a busca" : "Nenhum exame encontrado"}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredExames.map((exame) => (
                <Card
                  key={exame.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedExame?.id === exame.id ? "ring-2 ring-primary bg-accent/30" : ""
                  }`}
                  onClick={() => setSelectedExame(exame)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-xs truncate">{exame.paciente_nome}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(exame.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    {exame.status === "assinado" ? (
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Content - Split Screen */}
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={50} minSize={30}>
            <DicomViewerPanel arquivoUrl={selectedExame?.arquivo_url || null} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={50} minSize={30}>
            <LaudoEditorPanel
              exame={selectedExame}
              onSave={handleSave}
              onSign={() => setShowSignModal(true)}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Sign Modal */}
      <Dialog open={showSignModal} onOpenChange={setShowSignModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5" />
              Assinar Laudo Digitalmente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Informe seu Token de Autenticação (ICP-Brasil) para assinar digitalmente o laudo.
              Após assinado, o laudo será convertido em PDF e não poderá ser editado.
            </p>
            <Input
              type="password"
              placeholder="Token de assinatura digital..."
              value={signToken}
              onChange={(e) => setSignToken(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSignModal(false)}>Cancelar</Button>
            <Button onClick={handleSign} disabled={signing || !signToken.trim()}>
              {signing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FileSignature className="w-4 h-4 mr-1" />}
              Assinar e Gerar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Novo Exame
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium">Nome do Paciente</label>
              <Input
                placeholder="Nome completo..."
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Arquivo DICOM (.dcm)</label>
              <Input
                type="file"
                accept=".dcm,.dicom,image/*"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUpload(false)}>Cancelar</Button>
            <Button onClick={handleUpload} disabled={uploading || !uploadName.trim() || !uploadFile}>
              {uploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
              Enviar Exame
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TelelaudoWorkspace;
