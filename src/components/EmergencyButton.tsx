import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Phone, X, Stethoscope, ArrowRight } from "lucide-react";

const TRIAGE_QUESTIONS = [
  { text: "Dor no peito ou falta de ar?", emergency: true },
  { text: "Perda de consciência ou desmaio?", emergency: true },
  { text: "Sangramento intenso ou trauma grave?", emergency: true },
  { text: "Febre muito alta (acima de 39.5°C)?", emergency: true },
];

const EmergencyButton = () => {
  const [open, setOpen] = useState(false);
  const [triageStep, setTriageStep] = useState(-1);
  const [showEmergency, setShowEmergency] = useState(false);
  const navigate = useNavigate();

  const handleYes = () => {
    setShowEmergency(true);
  };

  const handleNo = () => {
    if (triageStep < TRIAGE_QUESTIONS.length - 1) {
      setTriageStep(triageStep + 1);
    } else {
      // All answers are "No" — safe for telemedicine
      setTriageStep(-2); // Special state: show telemedicine recommendation
    }
  };

  const reset = () => {
    setTriageStep(-1);
    setShowEmergency(false);
  };

  const handleOpen = () => {
    reset();
    setTriageStep(0);
    setOpen(true);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-destructive text-destructive-foreground shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform animate-pulse"
        title="Ajuda de Emergência"
      >
        <AlertTriangle className="w-5 h-5" />
      </button>

      {/* Modal */}
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
                      <h2 className="text-base font-bold text-foreground">Pré-Triagem</h2>
                    </div>
                    <button onClick={() => setOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>

                  {showEmergency ? (
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
                  ) : triageStep === -2 ? (
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                        <Stethoscope className="w-8 h-8 text-secondary" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-secondary">Telemedicina adequada ✅</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Seus sintomas são compatíveis com atendimento por teleconsulta. Agende com um médico disponível agora.
                        </p>
                      </div>
                      <Button
                        className="w-full bg-primary text-primary-foreground h-11"
                        onClick={() => { setOpen(false); navigate("/dashboard/schedule?urgency=true"); }}
                      >
                        <Stethoscope className="w-4 h-4 mr-2" /> Ver Médicos Disponíveis
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  ) : triageStep >= 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Responda para ajudarmos você da melhor forma:
                      </p>
                      <p className="text-base font-semibold text-foreground">
                        {TRIAGE_QUESTIONS[triageStep].text}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="destructive" className="flex-1 h-11" onClick={handleYes}>
                          Sim
                        </Button>
                        <Button variant="outline" className="flex-1 h-11" onClick={handleNo}>
                          Não
                        </Button>
                      </div>
                      <div className="flex gap-1">
                        {TRIAGE_QUESTIONS.map((_, i) => (
                          <div key={i} className={`h-1 flex-1 rounded-full ${i <= triageStep ? "bg-destructive" : "bg-muted"}`} />
                        ))}
                      </div>
                    </div>
                  ) : null}
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
