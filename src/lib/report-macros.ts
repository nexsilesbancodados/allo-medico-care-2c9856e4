export interface ReportMacro {
  id: string;
  trigger: string;
  label: string;
  category: string;
  text: string;
}

export const REPORT_MACROS: ReportMacro[] = [
  // ─── Tórax ───
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
  {
    id: "torax-pneumonia",
    trigger: "/torax-pneumonia",
    label: "Pneumonia",
    category: "Tórax",
    text: `**ACHADOS:**
Opacidade alveolar heterogênea em [lobo/segmento], com broncograma aéreo de permeio, compatível com consolidação parenquimatosa.
Seios costofrênicos [livres / obliterados].
Silhueta cardíaca dentro dos limites da normalidade.

**IMPRESSÃO DIAGNÓSTICA:**
Consolidação parenquimatosa em [localização], compatível com processo pneumônico. Correlacionar com dados clínicos e laboratoriais.`,
  },
  {
    id: "torax-condensacao",
    trigger: "/torax-condensacao",
    label: "Condensação Pulmonar",
    category: "Tórax",
    text: `**TÉCNICA:**
Radiografia de tórax em PA.

**ACHADOS:**
Opacidade heterogênea com broncograma aéreo em [lobo] [direito/esquerdo],
medindo aproximadamente [X] cm, de contornos mal definidos.
Seios costofrênicos [livres / com discreto velamento].
Silhueta cardíaca com ICT dentro dos limites da normalidade.

**IMPRESSÃO DIAGNÓSTICA:**
Condensação parenquimatosa em [localização]. DD: pneumonia, atelectasia,
neoplasia. Correlacionar com dados clínicos. Controle radiográfico recomendado.`,
  },
  {
    id: "torax-pneumotorax",
    trigger: "/torax-pneumotorax",
    label: "Pneumotórax",
    category: "Tórax",
    text: `**TÉCNICA:**
Radiografia de tórax em PA.

**ACHADOS:**
Hipertransparência avascular em [hemitórax direito/esquerdo], com linha pleural
visceral visível, compatível com pneumotórax de [pequeno/moderado/grande] volume.
[Sem/Com] desvio de mediastino contralateral.

**IMPRESSÃO DIAGNÓSTICA:**
Pneumotórax [direito/esquerdo] de [pequeno/moderado/grande] volume.`,
  },
  // ─── Abdome ───
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
  {
    id: "abdome-colelitiase",
    trigger: "/abdome-colelitiase",
    label: "Colelitíase",
    category: "Abdome",
    text: `**ACHADOS:**
Vesícula biliar normodistendida, com imagem hiperecogênica em seu interior medindo [X] mm, produzindo sombra acústica posterior, compatível com cálculo.
Paredes vesiculares finas, sem sinais de espessamento.
Vias biliares de calibre normal.

**IMPRESSÃO DIAGNÓSTICA:**
Colelitíase. Vesícula biliar com cálculo de [X] mm.`,
  },
  {
    id: "abdome-apendicite",
    trigger: "/abdome-apendicite",
    label: "Apendicite (US)",
    category: "Abdome",
    text: `**TÉCNICA:**
Ultrassonografia de abdome inferior com transdutor linear de alta frequência.

**ACHADOS:**
Estrutura tubular apendicular em FID, diâmetro AP de [X] mm (normal < 6 mm),
paredes espessadas, sem compressibilidade. [Presença/Ausência] de apendicolito.
[Presença/Ausência] de líquido livre periapendicular.
Hipervascularização ao Doppler colorido.

**IMPRESSÃO DIAGNÓSTICA:**
Achados compatíveis com apendicite aguda.
Correlação clínico-laboratorial e cirúrgica recomendada.`,
  },
  {
    id: "figado-normal",
    trigger: "/figado-normal",
    label: "Fígado Normal (US)",
    category: "Abdome",
    text: `**ACHADOS:**
Fígado de dimensões normais, lobo direito medindo [X] cm.
Ecotextura homogênea, ecogenicidade preservada.
Veia porta e supra-hepáticas de calibre normal.
Ausência de lesões focais, nódulos ou dilatação de vias biliares.
Vesícula biliar de paredes finas, sem cálculos ou pólipos.

**IMPRESSÃO DIAGNÓSTICA:**
Fígado e vesícula biliar sem alterações ultrassonográficas.`,
  },
  // ─── Crânio ───
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
  {
    id: "cranio-avc",
    trigger: "/cranio-avc",
    label: "AVC Isquêmico",
    category: "Crânio",
    text: `**ACHADOS:**
Área de hipodensidade no território da artéria [cerebral média/anterior/posterior] [direita/esquerda], com perda da diferenciação corticomedular, compatível com infarto isquêmico [agudo/subagudo].
Sistema ventricular [sem desvio / com discreto desvio da linha média].
Cisternas da base [preservadas / parcialmente obliteradas].
Sem sinais de hemorragia aguda.

**IMPRESSÃO DIAGNÓSTICA:**
Infarto isquêmico em território da artéria [localização]. Correlacionar com quadro clínico e angiografia.`,
  },
  {
    id: "cranio-hemorragia",
    trigger: "/cranio-hemorragia",
    label: "Hemorragia Intracraniana",
    category: "Crânio",
    text: `**TÉCNICA:**
Tomografia computadorizada de crânio sem contraste.

**ACHADOS:**
Área hiperdensa em [região/lobo], medindo [X x Y] mm, densidade [X] UH,
compatível com coleção hemorrágica [intraparenquimatosa/subdural/extradural].
[Sem/Com] edema perilesional. [Sem/Com] desvio da linha média.
Ventrículos [normais/alargados].

**IMPRESSÃO DIAGNÓSTICA:**
Hematoma [intraparenquimatoso/subdural] em [localização], medindo [X] mm.
Avaliação neurocirúrgica urgente recomendada.`,
  },
  // ─── Mama ───
  {
    id: "mama-birads1",
    trigger: "/mama-birads1",
    label: "Mamografia BI-RADS 1",
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
  {
    id: "mama-birads2",
    trigger: "/mama-birads2",
    label: "Mamografia BI-RADS 2",
    category: "Mama",
    text: `**TÉCNICA:**
Mamografia bilateral digital em incidências craniocaudal e mediolateral oblíqua.

**ACHADOS:**
Mamas de padrão [a/b/c/d] de composição.
[Descrever achados benignos: cistos, calcificações grosseiras, linfonodos intramamários, etc.]
Ausência de nódulos ou distorções suspeitas.

**IMPRESSÃO DIAGNÓSTICA:**
Achados mamográficos benignos.
Classificação BI-RADS® 2 — Achados benignos.
Controle mamográfico anual.`,
  },
  // ─── Coluna ───
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
  {
    id: "coluna-hernia",
    trigger: "/coluna-hernia",
    label: "Hérnia Discal Lombar",
    category: "Coluna",
    text: `**TÉCNICA:**
Ressonância magnética da coluna lombossacra nas sequências [T1, T2, STIR, sagital e axial].

**ACHADOS:**
Protrusão discal [posterior/posterolateral] em [L4-L5 / L5-S1], com [compressão / contato] da raiz nervosa [L5 / S1] [ipsilateral/bilateral].
Dimensões do canal vertebral [preservadas / levemente reduzidas].
Medula e cone medular de morfologia e sinal normais.
Demais espaços discais sem alterações significativas.

**IMPRESSÃO DIAGNÓSTICA:**
Protrusão discal em [nível], com [compressão/contato] radicular. Correlacionar com quadro clínico.`,
  },
  // ─── ECG ───
  {
    id: "ecg-normal",
    trigger: "/ecg-normal",
    label: "ECG Normal",
    category: "ECG",
    text: `**TÉCNICA:**
Eletrocardiograma de repouso em 12 derivações.

**ACHADOS:**
Ritmo sinusal regular.
Frequência cardíaca: [XX] bpm.
Eixo elétrico do QRS no plano frontal: [normal / desviado].
Intervalo PR: [normal, XX ms].
Duração do QRS: [normal, XX ms].
Intervalo QT/QTc: [normal, XX ms].
Ondas P de morfologia e voltagem normais.
Complexos QRS de amplitude e progressão normais em precordiais.
Segmento ST sem desnivelamentos.
Ondas T positivas em todas as derivações avaliáveis.

**IMPRESSÃO DIAGNÓSTICA:**
Eletrocardiograma dentro dos limites da normalidade.`,
  },
  {
    id: "ecg-fibrilacao",
    trigger: "/ecg-fa",
    label: "Fibrilação Atrial",
    category: "ECG",
    text: `**ACHADOS:**
Ritmo irregular, sem ondas P identificáveis, com oscilação da linha de base e intervalos RR variáveis, compatível com fibrilação atrial.
Frequência ventricular média: [XX] bpm.
Complexos QRS de morfologia [estreita/alargada].
Segmento ST [sem desnivelamentos / com alterações].

**IMPRESSÃO DIAGNÓSTICA:**
Fibrilação atrial com resposta ventricular [controlada/alta/baixa].`,
  },
  // ─── Ultrassom ───
  {
    id: "us-tireoide-normal",
    trigger: "/tireoide-normal",
    label: "US Tireoide Normal",
    category: "Ultrassom",
    text: `**TÉCNICA:**
Ultrassonografia da tireoide com Doppler colorido.

**ACHADOS:**
Tireoide tópica, de dimensões normais (lobo direito: [X]×[X]×[X] cm, volume [X] ml; lobo esquerdo: [X]×[X]×[X] cm, volume [X] ml). Istmo de espessura normal.
Parênquima de ecogenicidade habitual, com textura homogênea.
Ausência de nódulos, cistos ou calcificações.
Fluxo vascular ao Doppler sem alterações.
Cadeias linfonodais cervicais sem linfonodomegalias.

**IMPRESSÃO DIAGNÓSTICA:**
Ultrassonografia tireoidiana dentro dos limites da normalidade.`,
  },
  {
    id: "us-tireoide-nodulo",
    trigger: "/tireoide-nodulo",
    label: "Nódulo Tireoidiano",
    category: "Ultrassom",
    text: `**ACHADOS:**
Nódulo [sólido/misto/cístico] em [lobo direito/esquerdo/istmo], [hipoecoico/isoecoico/hiperecoico], de contornos [regulares/irregulares], medindo [X]×[X]×[X] mm, [com/sem] calcificações [micro/macro], [com/sem] halo periférico.
Fluxo ao Doppler [periférico/central/misto].

**IMPRESSÃO DIAGNÓSTICA:**
Nódulo tireoidiano em [localização], classificação TI-RADS [2/3/4/5].
[Acompanhamento / PAAF recomendada conforme classificação].`,
  },
  {
    id: "renal-normal",
    trigger: "/renal-normal",
    label: "Rins Normais (US)",
    category: "Ultrassom",
    text: `**ACHADOS:**
Rim direito medindo [X x Y x Z] cm, córtico-medular preservada.
Rim esquerdo de características semelhantes.
Bexiga bem distendida, paredes regulares, conteúdo anecoico.

**IMPRESSÃO DIAGNÓSTICA:**
Rins e bexiga sem alterações ultrassonográficas.`,
  },
  {
    id: "renal-calculo",
    trigger: "/renal-calculo",
    label: "Litíase Renal (US)",
    category: "Ultrassom",
    text: `**ACHADOS:**
Imagem hiperecogênica com sombra acústica em rim [direito/esquerdo],
localizada em [pelve/cálice], medindo [X] mm.
[Sem/Com] hidronefrose de grau [leve/moderado/grave].

**IMPRESSÃO DIAGNÓSTICA:**
Litíase renal [direito/esquerdo], [X] mm.
[Sem/Com] hidronefrose. Correlação clínica recomendada.`,
  },
  // ─── Ressonância Magnética ───
  {
    id: "rm-joelho-normal",
    trigger: "/joelho-normal",
    label: "RM Joelho Normal",
    category: "Ressonância",
    text: `**TÉCNICA:**
Ressonância magnética do joelho [direito/esquerdo] nas sequências T1, T2, STIR e DP nos planos sagital, coronal e axial.

**ACHADOS:**
Ligamentos cruzados anterior e posterior íntegros, de espessura e sinal normais.
Ligamentos colaterais medial e lateral sem alterações.
Meniscos medial e lateral de morfologia e sinal preservados, sem sinais de roturas.
Cartilagem articular de espessura preservada, sem defeitos condrais focais.
Tendão patelar e tendão quadricipital íntegros.
Ausência de derrame articular significativo.
Estruturas ósseas sem lesões focais, edema medular ou fraturas.

**IMPRESSÃO DIAGNÓSTICA:**
Ressonância magnética do joelho sem alterações significativas.`,
  },
  {
    id: "rm-joelho-lca",
    trigger: "/joelho-lca",
    label: "Lesão LCA",
    category: "Ressonância",
    text: `**ACHADOS:**
Ligamento cruzado anterior com [descontinuidade de suas fibras / aumento de sinal em T2 / ausência de visualização], compatível com [rotura parcial / rotura completa].
Edema ósseo subcondral no [côndilo femoral lateral / planalto tibial lateral], padrão contusivo ("kissing lesion").
[Menisco medial / lateral] [íntegro / com sinais de rotura no corno posterior].
Derrame articular [leve / moderado / acentuado].

**IMPRESSÃO DIAGNÓSTICA:**
Rotura [parcial / completa] do ligamento cruzado anterior.
[Lesões associadas se houver].`,
  },
  // ─── Musculoesquelético ───
  {
    id: "ombro-normal",
    trigger: "/ombro-normal",
    label: "Ombro Normal (RM)",
    category: "Musculoesquelético",
    text: `**TÉCNICA:**
Ressonância magnética do ombro [direito/esquerdo] sem contraste.

**ACHADOS:**
Manguito rotador íntegro: tendões do supraespinal, infraespinal,
subescapular e redondo menor sem roturas ou tendinopatia.
Bursa subacromial-subdeltoidea sem distensão.
Lábio glenoidal sem alterações. Tendão do bíceps em trajeto normal.

**IMPRESSÃO DIAGNÓSTICA:**
Ombro [direito/esquerdo] sem alterações à RM.`,
  },
  {
    id: "ombro-rotura",
    trigger: "/ombro-rotura",
    label: "Rotura Manguito Rotador",
    category: "Musculoesquelético",
    text: `**ACHADOS:**
Rotura [parcial/total] do tendão do [supraespinal/infraespinal/subescapular],
com descontinuidade das fibras em sua porção [articular/bursal], extensão [X] mm.
[Sem/Com] retração do coto. Bursa com [discreto/moderado] derrame.

**IMPRESSÃO DIAGNÓSTICA:**
Rotura [parcial/total] do tendão do [músculo], medindo [X] mm.
Avaliação ortopédica recomendada.`,
  },
  // ─── EEG ───
  {
    id: "eeg-normal",
    trigger: "/eeg-normal",
    label: "EEG Normal",
    category: "EEG",
    text: `**TÉCNICA:**
Eletroencefalograma de rotina em vigília, com duração de [XX] minutos, com eletrodos posicionados segundo o sistema internacional 10-20.

**ACHADOS:**
Ritmo de fundo: atividade alfa posterior bilateral, simétrica, reativa, com frequência de [8-12] Hz e amplitude [normal].
Atividade beta difusa de baixa amplitude.
Hiperpneia: sem alterações significativas.
Fotoestimulação intermitente: resposta fótica fisiológica, sem fotossensibilidade.
Ausência de atividade epileptiforme (pontas, ondas agudas, complexos ponta-onda).
Sem atividade lenta focal ou generalizada.

**IMPRESSÃO DIAGNÓSTICA:**
Eletroencefalograma dentro dos limites da normalidade para a faixa etária.`,
  },
  // ─── Espirometria ───
  {
    id: "espirometria-normal",
    trigger: "/espirometria-normal",
    label: "Espirometria Normal",
    category: "Espirometria",
    text: `**TÉCNICA:**
Espirometria com prova broncodilatadora, realizada conforme critérios de aceitabilidade e reprodutibilidade da ATS/ERS.

**ACHADOS:**
CVF: [X] L ([X]% do previsto) — Normal.
VEF1: [X] L ([X]% do previsto) — Normal.
VEF1/CVF: [X]% — Normal (acima do LIN).
FEF25-75%: [X] L/s ([X]% do previsto).
Curva fluxo-volume de morfologia normal.
Prova broncodilatadora: sem resposta significativa (variação < 12% e < 200 ml no VEF1).

**IMPRESSÃO DIAGNÓSTICA:**
Espirometria dentro dos limites da normalidade. Sem distúrbio ventilatório obstrutivo ou restritivo.`,
  },
  // ─── Ecocardiograma ───
  {
    id: "eco-normal",
    trigger: "/eco-normal",
    label: "Ecocardiograma Normal",
    category: "Ecocardiograma",
    text: `**TÉCNICA:**
Ecocardiograma transtorácico em repouso com Doppler.

**ACHADOS:**
VE de dimensões normais (DDVE: [X] mm | DSVE: [X] mm).
Função sistólica preservada (FEVE: [X]% — Simpson).
Função diastólica sem alterações significativas.
Válvulas mitral e aórtica sem alterações hemodinâmicas relevantes.
Átrios de dimensões normais. VD de dimensões e função normais.
Pericárdio sem derrame. PSAP estimada: [X] mmHg.

**IMPRESSÃO DIAGNÓSTICA:**
Ecocardiograma dentro dos limites da normalidade. FEVE [X]%.`,
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
