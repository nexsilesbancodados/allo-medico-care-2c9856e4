import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { getLaudistaNav } from "@/components/laudista/laudistaNav";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Pencil, Trash2, FileText } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const EXAM_TYPES = [
  "Raio-X de Tórax",
  "Tomografia Computadorizada",
  "Ressonância Magnética",
  "Ultrassonografia",
  "Eletrocardiograma",
  "Hemograma Completo",
  "Ecocardiograma",
  "Mamografia",
  "Densitometria Óssea",
  "Outro",
];

const ReportTemplateManager = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isLaudista = location.pathname.includes("/laudista/");
  const nav = isLaudista ? getLaudistaNav("templates") : getDoctorNav("report-templates");
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [examType, setExamType] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [saving, setSaving] = useState(false);

  /* eslint-disable @typescript-eslint/no-explicit-any -- report_templates not in generated types */
  const { data: templates, isLoading } = useQuery({
    queryKey: ["report-templates-manage"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("report_templates" as never)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as { id: string; title: string; exam_type: string; body_text: string; is_active: boolean; created_at: string }[];
    },
  });
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const resetForm = () => {
    setTitle("");
    setExamType("");
    setBodyText("");
    setEditingId(null);
  };

  const openEdit = (tpl: { id: string; title: string; exam_type: string; body_text: string }) => {
    setEditingId(tpl.id);
    setTitle(tpl.title);
    setExamType(tpl.exam_type);
    setBodyText(tpl.body_text);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title || !examType) {
      toast.error("Preencha título e tipo de exame");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from("report_templates" as never)
          .update({ title, exam_type: examType, body_text: bodyText })
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Template atualizado!");
      } else {
        const { error } = await supabase.from("report_templates" as never).insert({
          title,
          exam_type: examType,
          body_text: bodyText,
          created_by: user!.id,
        });
        if (error) throw error;
        toast.success("Template criado!");
      }
      queryClient.invalidateQueries({ queryKey: ["report-templates-manage"] });
      setDialogOpen(false);
      resetForm();
    } catch (err: unknown) {
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("report_templates" as never)
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Template removido!");
      queryClient.invalidateQueries({ queryKey: ["report-templates-manage"] });
    } catch (err: unknown) {
      toast.error("Erro", { description: err instanceof Error ? err.message : "Erro desconhecido" });
    }
  };

  return (
    <DashboardLayout nav={nav} title="Modelos de Laudo">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Templates de Laudo
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-1" /> Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Template" : "Novo Template"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Título</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Raio-X Tórax Normal" />
                </div>
                <div>
                  <Label>Tipo de Exame</Label>
                  <Select value={examType} onValueChange={setExamType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXAM_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Corpo do Laudo (Template)</Label>
                  <Textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Texto base do laudo que será pré-preenchido..."
                    rows={8}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingId ? "Salvar Alterações" : "Criar Template"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : !templates?.length ? (
            <p className="text-center text-muted-foreground py-8">Nenhum template criado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo de Exame</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((tpl) => (
                  <TableRow key={tpl.id}>
                    <TableCell className="font-medium">{tpl.title}</TableCell>
                    <TableCell>{tpl.exam_type}</TableCell>
                    <TableCell>
                      <Badge variant={tpl.is_active ? "default" : "secondary"}>
                        {tpl.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(tpl)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(tpl.id)}>
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default ReportTemplateManager;
