import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Stethoscope, Brain, Heart, Eye, Bone, Baby, Beaker,
  ArrowRight, RotateCcw, X, Loader2, AlertTriangle, Sparkles,
} from "lucide-react";

const SPECIALTY_ICONS: Record<string, typeof Stethoscope> = {
  "Dermatologia": Beaker,
  "Ortopedia": Bone,
  "Neurologia": Brain,
  "Cardiologia": Heart,
  "Oftalmologia": Eye,
  "Pediatria": Baby,
  "Clínico Geral": Stethoscope,
  "Endocrinologia": Stethoscope,
};

const URGENCY_COLORS: Record<string, string> = {
  low: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  high: "bg-destructive/10 text-destructive border-destructive/20",
};

const URGENCY_LABELS: Record<string, string> = {
  low: "Baixa urgência",
  medium: "Urgência moderada",
  high: "Alta urgência",
};

const SpecialtyQuiz = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"choice" | "quick" | "ai">("choice");
  const [symptoms, setSymptoms] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ specialty: string; reason: string; urgency: string } | null>(null);

  // Quick quiz state
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const QUESTIONS = [
    {
      text: "Qual é a principal região do seu desconforto?",
      options: [
        { label: "Pele, cabelo ou unhas", value: "Dermatologia" },
        { label: "Ossos, músculos ou articulações", value: "Ortopedia" },
        { label: "Cabeça, memória ou sono", value: "Neurologia" },
        { label: "Nenhuma em específico / Rotina", value: "Clínico Geral" },
      ],
    },
    {
      text: "Há quanto tempo sente o problema?",
      options: [
        { label: "Hoje / Poucos dias", value: "acute" },
        { label: "Semanas", value: "weeks" },
        { label: "Meses ou mais", value: "chronic" },
        { label: "É apenas um check-up", value: "checkup" },
      ],
    },
    {
      text: "Você já fez algum tratamento antes?",
      options: [
        { label: "Sim, mas não resolveu", value: "tried" },
        { label: "Não, é a primeira vez", value: "first" },
        { label: "Quero uma segunda opinião", value: "second" },
        { label: "Preciso renovar receita", value: "renew" },
      ],
    },
  ];

  const handleQuickAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      setResult({
        specialty: newAnswers[0],
        reason: "Com base nas suas respostas, essa é a especialidade mais indicada.",
        urgency: "low",
      });
    }
  };

  const handleAITriage = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("symptom-triage", {
        body: { symptoms: symptoms.trim() },
      });
      if (error) throw error;
      setResult(data);
    } catch (e) {
      console.error(e);
      setResult({
        specialty: "Clínico Geral",
        reason: "Recomendamos uma avaliação geral com um clínico.",
        urgency: "low",
      });
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMode("choice");
    setStep(0);
    setAnswers([]);
    setResult(null);
    setSymptoms("");
  };

  const Icon = result ? (SPECIALTY_ICONS[result.specialty] || Stethoscope) : Stethoscope;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="border-border shadow-2xl">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Triagem Inteligente</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Choose mode */}
              {mode === "choice" && !result && (
                <motion.div key="choice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-sm text-muted-foreground mb-4">Como prefere encontrar a especialidade ideal?</p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setMode("quick")}
                      className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all"
                    >
                      <p className="font-medium text-foreground">🎯 Quiz Rápido</p>
                      <p className="text-xs text-muted-foreground mt-1">3 perguntas simples para encontrar o especialista</p>
                    </button>
                    <button
                      onClick={() => setMode("ai")}
                      className="w-full text-left p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <p className="font-medium text-foreground">Triagem com IA</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Descreva seus sintomas e nossa IA sugere o especialista ideal</p>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Quick quiz */}
              {mode === "quick" && !result && (
                <motion.div key={`q-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                  <div className="flex gap-1 mb-5">
                    {QUESTIONS.map((_, i) => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
                    ))}
                  </div>
                  <p className="text-sm font-medium text-foreground mb-4">{QUESTIONS[step].text}</p>
                  <div className="space-y-2">
                    {QUESTIONS[step].options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleQuickAnswer(opt.value)}
                        className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm text-foreground active:scale-[0.98]"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* AI triage */}
              {mode === "ai" && !result && (
                <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-sm text-muted-foreground mb-3">
                    Descreva seus sintomas com detalhes. A IA analisará e sugerirá a especialidade mais adequada.
                  </p>
                  <Textarea
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                    placeholder="Ex: Estou com dor de cabeça há 3 dias, principalmente à tarde, acompanhada de tontura leve..."
                    rows={4}
                    className="mb-3"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setMode("choice")} className="flex-1">Voltar</Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-primary text-primary-foreground"
                      onClick={handleAITriage}
                      disabled={loading || !symptoms.trim()}
                    >
                      {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Analisando...</> : <><Sparkles className="w-4 h-4 mr-1" /> Analisar</>}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    ⚠️ Isto não é um diagnóstico médico. Apenas uma sugestão de especialidade.
                  </p>
                </motion.div>
              )}

              {/* Result */}
              {result && (
                <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">{result.specialty}</Badge>
                    {result.urgency && result.urgency !== "low" && (
                      <Badge className={`ml-2 ${URGENCY_COLORS[result.urgency] || ""}`}>
                        {result.urgency === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {URGENCY_LABELS[result.urgency] || result.urgency}
                      </Badge>
                    )}
                    <p className="text-sm text-muted-foreground mt-2">{result.reason}</p>
                  </div>
                  {result.urgency === "high" && (
                    <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                      ⚠️ Se seus sintomas são intensos, procure uma emergência presencial imediatamente.
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={reset} className="flex-1">
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refazer
                    </Button>
                    <Button size="sm" className="flex-1 bg-primary text-primary-foreground" onClick={() => { onClose(); navigate("/dashboard/schedule"); }}>
                      Buscar Médico <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SpecialtyQuiz;
