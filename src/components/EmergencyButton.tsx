import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, X, Stethoscope, ArrowRight, Heart, Brain, Bone, Eye, Baby, Thermometer, Wind, Activity } from "lucide-react";

const SYMPTOM_CATEGORIES = [
  { label: "Dor de cabeça", icon: Brain, specialty: "Neurologia" },
  { label: "Dor no peito", icon: Heart, specialty: "Cardiologia" },
  { label: "Problemas de pele", icon: Activity, specialty: "Dermatologia" },
  { label: "Dor muscular/osso", icon: Bone, specialty: "Ortopedia" },
  { label: "Problemas de visão", icon: Eye, specialty: "Oftalmologia" },
  { label: "Criança doente", icon: Baby, specialty: "Pediatria" },
  { label: "Febre alta", icon: Thermometer, specialty: "Clínica Geral" },
  { label: "Falta de ar", icon: Wind, specialty: "Clínica Geral" },
];

const TRIAGE_QUESTIONS = [
  { text: "Dor no peito ou falta de ar intensa?", emergency: true },
  { text: "Perda de consciência ou desmaio?", emergency: true },
  { text: "Sangramento intenso ou trauma grave?", emergency: true },
  { text: "Febre muito alta (acima de 39.5°C)?", emergency: true },
];

const EmergencyButton = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"category" | "triage" | "emergency" | "safe">("category");
  const [triageIdx, setTriageIdx] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<typeof SYMPTOM_CATEGORIES[0] | null>(null);
  const navigate = useNavigate();

  const handleOpen = () => {
    setStep("category");
    setTriageIdx(0);
    setSelectedCategory(null);
    setOpen(true);
  };

  const selectCategory = (cat: typeof SYMPTOM_CATEGORIES[0]) => {
    setSelectedCategory(cat);
    setTriageIdx(0);
    setStep("triage");
  };

  const handleTriageYes = () => setStep("emergency");

  const handleTriageNo = () => {
    if (triageIdx < TRIAGE_QUESTIONS.length - 1) {
      setTriageIdx(triageIdx + 1);
    } else {
      setStep("safe");
    }
  };

  const goToSearch = () => {
    setOpen(false);
    const spec = selectedCategory?.specialty ? `&specialty=${encodeURIComponent(selectedCategory.specialty)}` : "";
    navigate(`/dashboard/schedule?urgency=true${spec}`);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform animate-pulse"
        title="Ajuda de Emergência"
      >
        <AlertTriangle className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm"
            >
              <Card className="border-destructive/30 shadow-2xl">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                      </div>
                      <h2 className="text-base font-bold text-foreground">
                        {step === "category" ? "O que você sente?" : "Pré-Triagem"}
                      </h2>
                    </div>
                    <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>

                  {step === "category" && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">Selecione o sintoma principal:</p>
                      <div className="grid grid-cols-2 gap-2">
                        {SYMPTOM_CATEGORIES.map(cat => {
                          const Icon = cat.icon;
                          return (
                            <button
                              key={cat.label}
                              onClick={() => selectCategory(cat)}
                              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 active:scale-95 transition-all"
                            >
                              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                                <Icon className="w-5 h-5 text-destructive" />
                              </div>
                              <span className="text-xs font-medium text-foreground text-center leading-tight">{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-center text-muted-foreground mt-2">
                        ⚠️ Em caso de emergência real, ligue 192 (SAMU)
                      </p>
                    </div>
                  )}

                  {step === "triage" && (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Responda para ajudarmos você da melhor forma:
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {TRIAGE_QUESTIONS[triageIdx].text}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="destructive" className="flex-1 h-11" onClick={handleTriageYes}>Sim</Button>
                        <Button variant="outline" className="flex-1 h-11" onClick={handleTriageNo}>Não</Button>
                      </div>
                      <div className="flex gap-1">
                        {TRIAGE_QUESTIONS.map((_, i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i <= triageIdx ? "bg-destructive" : "bg-muted"}`} />
                        ))}
                      </div>
                    </div>
                  )}

                  {step === "emergency" && (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                        <Phone className="w-8 h-8 text-destructive" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-destructive">Emergência Médica</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Seus sintomas podem indicar uma emergência. Procure atendimento presencial imediatamente.
                        </p>
                      </div>
                      <a href="tel:192" className="block">
                        <Button className="w-full bg-destructive text-destructive-foreground h-12 text-base">
                          <Phone className="w-5 h-5 mr-2" /> Ligar SAMU (192)
                        </Button>
                      </a>
                      <p className="text-xs text-muted-foreground">Ou ligue 190 (Emergência) / 193 (Bombeiros)</p>
                    </div>
                  )}

                  {step === "safe" && (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                        <Stethoscope className="w-8 h-8 text-secondary" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-secondary">Telemedicina adequada ✅</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedCategory
                            ? `Recomendamos um especialista em ${selectedCategory.specialty}.`
                            : "Seus sintomas são compatíveis com teleconsulta."}
                        </p>
                      </div>
                      <Button className="w-full bg-primary text-primary-foreground h-11" onClick={goToSearch}>
                        <Stethoscope className="w-4 h-4 mr-2" /> Ver Médicos Disponíveis
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EmergencyButton;
