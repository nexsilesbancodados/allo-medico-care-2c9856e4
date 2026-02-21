import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Brain, Heart, Eye, Bone, Baby, Beaker, ArrowRight, RotateCcw, X } from "lucide-react";

interface Question {
  text: string;
  options: { label: string; value: string }[];
}

const QUESTIONS: Question[] = [
  {
    text: "Qual é a principal região do seu desconforto?",
    options: [
      { label: "Pele, cabelo ou unhas", value: "skin" },
      { label: "Ossos, músculos ou articulações", value: "bones" },
      { label: "Cabeça, memória ou sono", value: "head" },
      { label: "Nenhuma em específico / Rotina", value: "general" },
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

const SPECIALTY_MAP: Record<string, { name: string; description: string; icon: typeof Stethoscope }> = {
  skin: { name: "Dermatologia", description: "Especialista em problemas de pele, cabelo e unhas.", icon: Beaker },
  bones: { name: "Ortopedia", description: "Cuida de ossos, músculos e articulações.", icon: Bone },
  head: { name: "Neurologia", description: "Especialista em sistema nervoso, dores de cabeça e sono.", icon: Brain },
  general: { name: "Clínico Geral", description: "Avaliação completa e encaminhamento se necessário.", icon: Stethoscope },
};

const SpecialtyQuiz = ({ onClose }: { onClose: () => void }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<string | null>(null);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (step === 0) {
      // First question determines specialty
      if (step < QUESTIONS.length - 1) {
        setStep(step + 1);
      }
    } else if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Final step — show result
      setResult(newAnswers[0]); // Primary answer drives recommendation
    }
  };

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setResult(null);
  };

  const specialty = result ? SPECIALTY_MAP[result] || SPECIALTY_MAP.general : null;

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
                <h2 className="text-lg font-bold text-foreground">Qual especialidade você precisa?</h2>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress */}
            {!result && (
              <div className="flex gap-1 mb-5">
                {QUESTIONS.map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
            )}

            <AnimatePresence mode="wait">
              {!result ? (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-sm font-medium text-foreground mb-4">{QUESTIONS[step].text}</p>
                  <div className="space-y-2">
                    {QUESTIONS[step].options.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswer(opt.value)}
                        className="w-full text-left p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-sm text-foreground active:scale-[0.98]"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : specialty ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <specialty.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <Badge className="bg-primary/10 text-primary border-primary/20 mb-2">{specialty.name}</Badge>
                    <p className="text-sm text-muted-foreground">{specialty.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={reset} className="flex-1">
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> Refazer
                    </Button>
                    <Button size="sm" className="flex-1 bg-primary text-primary-foreground" onClick={() => { onClose(); navigate("/dashboard/schedule"); }}>
                      Buscar Médico <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SpecialtyQuiz;
