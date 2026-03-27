import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/logger";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AlocExame {
  id: string;
  paciente_id: string | null;
  medico_solicitante_id: string | null;
  laudista_id: string | null;
  tipo_exame: string;
  status: string;
  orthanc_study_uid: string | null;
  orthanc_study_url: string | null;
  created_at: string;
}

export interface AlocLaudo {
  id: string;
  exame_id: string;
  medico_id: string;
  conteudo_html: string;
  conteudo_ia: string | null;
  status: string;
  assinado_em: string | null;
  pdf_url: string | null;
  qr_token: string;
  created_at: string;
}

const ORTHANC_URL = "http://72.62.138.208:8042";
const OHIF_URL = "http://72.62.138.208:3001";

// ─── Exames ───────────────────────────────────────────────────────────────────

export async function fetchExamesParaLaudar() {
  const { data, error } = await supabase
    .from("aloc_exames")
    .select("*")
    .in("status", ["aguardando", "em_laudo"])
    .order("created_at", { ascending: true });
  if (error) { logError("fetchExamesParaLaudar", error); throw error; }
  return data as AlocExame[];
}

export async function fetchExamePorId(id: string) {
  const { data, error } = await supabase
    .from("aloc_exames")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) { logError("fetchExamePorId", error); throw error; }
  return data as AlocExame | null;
}

export async function assumirExame(exameId: string, laudistaId: string) {
  const { error } = await supabase
    .from("aloc_exames")
    .update({ laudista_id: laudistaId, status: "em_laudo" })
    .eq("id", exameId);
  if (error) { logError("assumirExame", error); throw error; }
}

export async function concluirExame(exameId: string) {
  const { error } = await supabase
    .from("aloc_exames")
    .update({ status: "concluido" })
    .eq("id", exameId);
  if (error) { logError("concluirExame", error); throw error; }
}

// ─── Laudos ───────────────────────────────────────────────────────────────────

export async function fetchLaudoPorExame(exameId: string) {
  const { data, error } = await supabase
    .from("aloc_laudos")
    .select("*")
    .eq("exame_id", exameId)
    .maybeSingle();
  if (error) { logError("fetchLaudoPorExame", error); throw error; }
  return data as AlocLaudo | null;
}

export async function criarLaudo(exameId: string, medicoId: string) {
  const { data, error } = await supabase
    .from("aloc_laudos")
    .insert({ exame_id: exameId, medico_id: medicoId })
    .select()
    .single();
  if (error) { logError("criarLaudo", error); throw error; }
  return data as AlocLaudo;
}

export async function salvarLaudo(laudoId: string, conteudoHtml: string) {
  const { error } = await supabase
    .from("aloc_laudos")
    .update({ conteudo_html: conteudoHtml })
    .eq("id", laudoId);
  if (error) { logError("salvarLaudo", error); throw error; }
}

export async function assinarLaudo(laudoId: string, exameId: string) {
  const { error: laudoErr } = await supabase
    .from("aloc_laudos")
    .update({ status: "assinado", assinado_em: new Date().toISOString() })
    .eq("id", laudoId);
  if (laudoErr) { logError("assinarLaudo", laudoErr); throw laudoErr; }

  await concluirExame(exameId);
}

// ─── Validação pública ────────────────────────────────────────────────────────

export async function validarLaudoPublico(qrToken: string) {
  const { data, error } = await supabase.rpc("validar_laudo_publico", { p_token: qrToken });
  if (error) { logError("validarLaudoPublico", error); throw error; }
  return (data as any[])?.[0] ?? null;
}

// ─── Orthanc helpers ──────────────────────────────────────────────────────────

export function buildOhifUrl(studyUid: string) {
  return `${OHIF_URL}/viewer?StudyInstanceUIDs=${studyUid}`;
}

export { ORTHANC_URL, OHIF_URL };
