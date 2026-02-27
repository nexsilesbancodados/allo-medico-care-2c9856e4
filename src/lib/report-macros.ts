export interface ReportMacro {
  id: string;
  trigger: string;
  label: string;
  category: string;
  text: string;
}

export const REPORT_MACROS: ReportMacro[] = [
  // Tórax
  {
    id: "torax-normal",
    trigger: "/torax-normal",
    label: "Tórax Normal",
    category: "Tórax",
    text: `**TÉCNICA:**
Radiografia de tórax em incidências PA e perfil.

**ACHADOS:**
Campos pulmonares com transparência preservada, sem consolidações, massas ou nódulos.
Seios costofrênicos livres bilateralmente.
Silhueta cardíaca dentro dos limites da normalidade (ICT < 0,50).
Mediastino centrado, sem alargamento.
Arcabouço ósseo sem alterações significativas.
Partes moles sem anormalidades.

**IMPRESSÃO DIAGNÓSTICA:**
Exame radiográfico do tórax dentro dos limites da normalidade.`,
  },
  {
    id: "torax-derrame",
    trigger: "/torax-derrame",
    label: "Derrame Pleural",
    category: "Tórax",
    text: `**ACHADOS:**
Velamento homogêneo do seio costofrênico [direito/esquerdo], com formação de menisco, compatível com derrame pleural de [pequeno/moderado/grande] volume.
Demais campos pulmonares com transparência preservada.

**IMPRESSÃO DIAGNÓSTICA:**
Derrame pleural [direito/esquerdo] de [pequeno/moderado/grande] volume.`,
  },
  // Abdome
  {
    id: "abdome-normal",
    trigger: "/abdome-normal",
    label: "Abdome Normal",
    category: "Abdome",
    text: `**TÉCNICA:**
Ultrassonografia abdominal total com Doppler.

**ACHADOS:**
Fígado de dimensões, contornos e ecotextura normais. Vesícula biliar normodistendida, de paredes finas, sem cálculos. Vias biliares intra e extra-hepáticas de calibre normal. Pâncreas de dimensões e ecogenicidade normais. Baço homogêneo, de dimensões normais. Rins tópicos, de dimensões e contornos normais, com boa diferenciação corticomedular, sem sinais de ectasia pielocalicial ou cálculos. Aorta de calibre normal. Bexiga normodistendida, de paredes lisas. Ausência de líquido livre na cavidade.

**IMPRESSÃO DIAGNÓSTICA:**
Ultrassonografia abdominal total sem alterações significativas.`,
  },
  // Crânio
  {
    id: "cranio-tc-normal",
    trigger: "/cranio-normal",
    label: "TC Crânio Normal",
    category: "Crânio",
    text: `**TÉCNICA:**
Tomografia computadorizada do crânio sem contraste endovenoso.

**ACHADOS:**
Parênquima encefálico de morfologia e atenuação normais, sem evidências de coleções, lesões expansivas ou áreas de isquemia aguda.
Sistema ventricular de dimensões e morfologia normais.
Cisternas da base e espaços liquóricos periencefálicos preservados.
Estruturas ósseas da calota craniana sem fraturas.
Seios paranasais e mastoideias aerados.

**IMPRESSÃO DIAGNÓSTICA:**
Tomografia computadorizada do crânio sem alterações agudas.`,
  },
  // Mama
  {
    id: "mama-birads1",
    trigger: "/mama-birads1",
    label: "Mamografia BIRADS 1",
    category: "Mama",
    text: `**TÉCNICA:**
Mamografia bilateral digital em incidências craniocaudal e mediolateral oblíqua.

**ACHADOS:**
Mamas de padrão [a/b/c/d] de composição.
Ausência de nódulos, distorções arquiteturais, assimetrias ou microcalcificações suspeitas.
Pele e complexos areolopapilares de aspecto normal.
Regiões axilares sem linfonodomegalias.

**IMPRESSÃO DIAGNÓSTICA:**
Mamografia sem achados suspeitos.
Classificação BI-RADS® 1 — Negativo.
Controle mamográfico anual.`,
  },
  // Coluna
  {
    id: "coluna-lombar-normal",
    trigger: "/coluna-normal",
    label: "Coluna Lombar Normal",
    category: "Coluna",
    text: `**TÉCNICA:**
Radiografia da coluna lombossacra em AP e perfil.

**ACHADOS:**
Corpos vertebrais de L1 a S1 com altura, alinhamento e morfologia preservados.
Espaços intervertebrais mantidos.
Pedículos simétricos.
Articulações sacroilíacas sem alterações.
Partes moles sem anormalidades.

**IMPRESSÃO DIAGNÓSTICA:**
Exame radiográfico da coluna lombossacra sem alterações significativas.`,
  },
];

export function findMacro(text: string): ReportMacro | null {
  const lines = text.split("\n");
  const lastLine = lines[lines.length - 1]?.trim().toLowerCase();
  if (!lastLine?.startsWith("/")) return null;
  return REPORT_MACROS.find((m) => m.trigger === lastLine) || null;
}

export function applyMacro(currentText: string, macro: ReportMacro): string {
  const lines = currentText.split("\n");
  lines.pop(); // remove the trigger line
  const prefix = lines.join("\n");
  return prefix ? `${prefix}\n\n${macro.text}` : macro.text;
}
