import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Search, Upload, FileText, Heart, Video, ArrowRight, X, Sparkles } from "lucide-react";
import mascotWelcome from "@/assets/mascot-welcome.png";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; path: string };
  color: string;
}

const STEPS: OnboardingStep[] = [
  {
    icon: <Sparkles className="w-8 h-8" />,
    title: "Bem-vindo(a) à AloClínica! 🎉",
    description: "Sua saúde agora está a um clique de distância. Vamos te mostrar como usar a plataforma em poucos passos.",
    color: "text-primary",
  },
  {
    icon: <Search className="w-8 h-8" />,
    title: "Encontre seu médico",
    description: "Busque por especialidade, nome ou CRM. Use filtros de preço, avaliação e disponibilidade para encontrar o profissional ideal.",
    action: { label: "Buscar médicos", path: "/dashboard/doctors" },
    color: "text-primary",
  },
  {
    icon: <Calendar className="w-8 h-8" />,
    title: "Agende sua consulta",
    description: "Escolha a data e horário que melhor se encaixam na sua rotina. A consulta é 100% online por vídeo.",
    action: { label: "Agendar agora", path: "/dashboard/schedule" },
    color: "text-secondary",
  },
  {
    icon: <Video className="w-8 h-8" />,
    title: "Sala de espera virtual",
    description: "Antes da consulta, testamos sua câmera e microfone. Você verá quando o médico entrar na sala.",
    color: "text-primary",
  },
  {
    icon: <Upload className="w-8 h-8" />,
    title: "Envie seus exames",
    description: "Compartilhe resultados de exames, laudos e documentos diretamente com seu médico de forma segura.",
    action: { label: "Enviar exames", path: "/dashboard/patient/documents" },
    color: "text-warning",
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Receitas e prontuário",
    description: "Acesse receitas digitais, atestados e seu histórico médico completo a qualquer momento.",
    action: { label: "Ver saúde", path: "/dashboard/patient/health" },
    color: "text-secondary",
  },
  {
    icon: <Heart className="w-8 h-8" />,
    title: "Tudo pronto! 💚",
    description: "Você já sabe o essencial. Agende sua primeira consulta e comece a cuidar da sua saúde com a AloClínica.",
    action: { label: "Agendar primeira consulta", path: "/dashboard/schedule" },
    color: "text-primary",
  },
];

const ONBOARDING_KEY = "aloclinica_onboarding_completed";

interface PatientOnboardingProps {
  onComplete: () => void;
}

const PatientOnboarding = ({ onComplete }: PatientOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(ONBOARDING_KEY, "true");
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
  };

  const handleAction = (path: string) => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    onComplete();
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/60 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Progress bar */}
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-gradient-to-r from-primary to-secondary"
                animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Skip button */}
            <div className="flex justify-end p-3 pb-0">
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                Pular <X className="w-3 h-3" />
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="px-6 pb-6 text-center"
              >
                {/* Mascot on first step */}
                {isFirst && (
                  <img src={mascotWelcome} alt="Mascot" className="w-20 h-20 mx-auto mb-2" />
                )}

                {/* Icon */}
                {!isFirst && (
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center ${step.color}`}>
                    {step.icon}
                  </div>
                )}

                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-2">
                  {step.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {step.description}
                </p>

                {/* Step dots */}
                <div className="flex justify-center gap-1.5 mb-5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentStep(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === currentStep
                          ? "w-6 bg-primary"
                          : i < currentStep
                          ? "w-1.5 bg-primary/40"
                          : "w-1.5 bg-muted-foreground/20"
                      }`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10"
                      onClick={() => setCurrentStep(prev => prev - 1)}
                    >
                      Voltar
                    </Button>
                  )}
                  {step.action && !isLast && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-10 text-primary border-primary/30 hover:bg-primary/10"
                      onClick={() => handleAction(step.action!.path)}
                    >
                      {step.action.label}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className={`flex-1 h-10 active:scale-[0.97] transition-transform ${
                      isLast ? "bg-gradient-hero text-primary-foreground" : ""
                    }`}
                    onClick={isLast && step.action ? () => handleAction(step.action!.path) : handleNext}
                  >
                    {isLast ? (
                      <>
                        {step.action?.label || "Começar"} <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    ) : (
                      <>
                        Próximo <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export { ONBOARDING_KEY };
export default PatientOnboarding;
