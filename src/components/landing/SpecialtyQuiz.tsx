import { logError } from "@/lib/logger";
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
  ArrowRight, RotateCcw, X, Loader2, AlertTriangle, Sparkles, Share2, CheckCircle,
} from "lucide-react";
import { toast } from "sonner";

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

const SPECIALTY_COLORS: Record<string, string> = {
  "Dermatologia": "from-amber-500/20 to-amber-500/5",
  "Ortopedia": "from-blue-500/20 to-blue-500/5",
  "Neurologia": "from-purple-500/20 to-purple-500/5",
  "Cardiologia": "from-red-500/20 to-red-500/5",
  "Oftalmologia": "from-cyan-500/20 to-cyan-500/5",
  "Pediatria": "from-pink-500/20 to-pink-500/5",
  "Clínico Geral": "from-primary/20 to-primary/5",
  "Endocrinologia": "from-emerald-500/20 to-emerald-500/5",
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
  const [showConfetti, setShowConfetti] = useState(false);

  // Quick quiz state
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const QUESTIONS = [
    {
      text: "Qual é a principal região do seu desconforto?",
      options: [
        { label: "🧴 Pele, cabelo ou unhas", value: "Dermatologia" },
        { label: "🦴 Ossos, músculos ou articulações", value: "Ortopedia" },
        { label: "🧠 Cabeça, memória ou sono", value: "Neurologia" },
        { label: "💊 Nenhuma em específico / Rotina", value: "Clínico Geral" },
      ],
    },
    {
      text: "Há quanto tempo sente o problema?",
      options: [
        { label: "⚡ Hoje / Poucos dias", value: "acute" },
        { label: "📅 Semanas", value: "weeks" },
        { label: "📆 Meses ou mais", value: "chronic" },
        { label: "✅ É apenas um check-up", value: "checkup" },
      ],
    },
    {
      text: "Você já fez algum tratamento antes?",
      options: [
        { label: "💊 Sim, mas não resolveu", value: "tried" },
        { label: "🆕 Não, é a primeira vez", value: "first" },
        { label: "🔍 Quero uma segunda opinião", value: "second" },
        { label: "📋 Preciso renovar receita", value: "renew" },
      ],
    },
  ];

  const showResult = (res: { specialty: string; reason: string; urgency: string }) => {
    setResult(res);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleQuickAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      showResult({
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
      showResult(data);
    } catch (e) {
      logError("SpecialtyQuiz error", e);
      showResult({
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

  const handleShare = () => {
    if (!result) return;
    const text = `Fiz a triagem na AloClinica e a especialidade recomendada foi: ${result.specialty}. Experimente: https://allo-medico-care.lovable.app`;
    if (navigator.share) {
      navigator.share({ title: "Triagem AloClinica", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Link copiado!");
    }
  };

  const Icon = result ? (SPECIALTY_ICONS[result.specialty] || Stethoscope) : Stethoscope;
  const gradientColor = result ? (SPECIALTY_COLORS[result.specialty] || "from-primary/20 to-primary/5") : "";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md"
      >
        {/* Confetti */}
        <AnimatePresence>
          {showConfetti && (
            <>
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    opacity: 1,
                    x: 0,
                    y: 0,
                    scale: 1,
                  }}
                  animate={{
                    opacity: 0,
                    x: (Math.random() - 0.5) * 300,
                    y: -Math.random() * 400 - 50,
                    scale: 0,
                    rotate: Math.random() * 720,
                  }}
                  transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full pointer-events-none z-50"
                  style={{
                    backgroundColor: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"][i % 6],
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        <Card className="border-border shadow-2xl overflow-hidden">
          {/* Colored top bar */}
          <div className={`h-1.5 bg-gradient-to-r ${result ? gradientColor : "from-primary to-secondary"}`} />
          
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground">Triagem Inteligente</h2>
                  <p className="text-[10px] text-muted-foreground">Powered by DeepSeek AI</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {/* Step 1: Choose mode */}
              {mode === "choice" && !result && (
                <motion.div key="choice" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <p className="text-sm text-muted-foreground mb-4">Como prefere encontrar a especialidade ideal?</p>
                  <div className="space-y-3">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMode("quick")}
                      className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group"
                    >
                      <p className="font-medium text-foreground flex items-center gap-2">🎯 Quiz Rápido <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">~30s</span></p>
                      <p className="text-xs text-muted-foreground mt-1">3 perguntas simples para encontrar o especialista</p>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setMode("ai")}
                      className="w-full text-left p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <p className="font-medium text-foreground">Triagem com IA</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">Recomendado</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Descreva seus sintomas e nossa IA sugere o especialista ideal</p>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* Quick quiz */}
              {mode === "quick" && !result && (
                <motion.div key={`q-${step}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div className="flex gap-1 mb-4">
                    {QUESTIONS.map((_, i) => (
                      <motion.div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`}
                        initial={i === step ? { scaleX: 0 } : {}}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">Pergunta {step + 1} de {QUESTIONS.length}</p>
                  <p className="text-sm font-semibold text-foreground mb-4">{QUESTIONS[step].text}</p>
                  <div className="space-y-2">
                    {QUESTIONS[step].options.map(opt => (
                      <motion.button
                        key={opt.value}
                        whileHover={{ scale: 1.01, x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuickAnswer(opt.value)}
                        className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm text-foreground"
                      >
                        {opt.label}
                      </motion.button>
                    ))}
                  </div>
                  <button onClick={() => { if (step > 0) { setStep(step - 1); setAnswers(answers.slice(0, -1)); } else setMode("choice"); }} className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    ← Voltar
                  </button>
                </motion.div>
              )}

              {/* AI triage */}
              {mode === "ai" && !result && (
                <motion.div key="ai" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <p className="text-sm text-muted-foreground mb-3">
                    Descreva seus sintomas com detalhes. A IA analisará e sugerirá a especialidade mais adequada.
                  </p>
                  <Textarea
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                    placeholder="Ex: Estou com dor de cabeça há 3 dias, principalmente à tarde, acompanhada de tontura leve..."
                    rows={4}
                    className="mb-3 resize-none"
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
                <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200 }} className="space-y-4">
                  {/* Specialty card */}
                  <div className={`rounded-2xl bg-gradient-to-br ${gradientColor} p-6 text-center`}>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                      className="w-16 h-16 rounded-2xl bg-card shadow-card flex items-center justify-center mx-auto mb-3"
                    >
                      <Icon className="w-8 h-8 text-primary" />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1 mb-2">{result.specialty}</Badge>
                    </motion.div>
                    {result.urgency && result.urgency !== "low" && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                        <Badge className={`${URGENCY_COLORS[result.urgency] || ""}`}>
                          {result.urgency === "high" && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {URGENCY_LABELS[result.urgency] || result.urgency}
                        </Badge>
                      </motion.div>
                    )}
                  </div>

                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-sm text-muted-foreground text-center leading-relaxed">
                    {result.reason}
                  </motion.p>

                  {result.urgency === "high" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      Se seus sintomas são intensos, procure uma emergência presencial imediatamente.
                    </motion.div>
                  )}

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={reset} className="flex-1">
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refazer
                    </Button>
                    <Button size="sm" className="flex-1 bg-primary text-primary-foreground" onClick={() => { onClose(); navigate("/dashboard/schedule"); }}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Buscar Médico
                    </Button>
                  </motion.div>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    onClick={handleShare}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-1.5"
                  >
                    <Share2 className="w-3 h-3" /> Compartilhar resultado
                  </motion.button>
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
