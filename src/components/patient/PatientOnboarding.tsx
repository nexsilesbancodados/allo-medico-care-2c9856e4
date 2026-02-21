import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Upload, FileText, Heart, Video, ArrowRight, ArrowLeft, X, Sparkles, User, Droplets, AlertTriangle, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mascotWelcome from "@/assets/mascot-welcome.png";
import { formatMask } from "@/hooks/use-mask";

const ONBOARDING_KEY = "aloclinica_onboarding_completed";

interface PatientOnboardingProps {
  onComplete: () => void;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const PatientOnboarding = ({ onComplete }: PatientOnboardingProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Profile data
  const [firstName, setFirstName] = useState(profile?.first_name || "");
  const [lastName, setLastName] = useState(profile?.last_name || "");
  const [cpf, setCpf] = useState(profile?.cpf || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || "");
  const [bloodType, setBloodType] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyInput, setAllergyInput] = useState("");
  const [chronicConditions, setChronicConditions] = useState<string[]>([]);
  const [conditionInput, setConditionInput] = useState("");

  // Load existing profile data
  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setCpf(data.cpf || "");
          setPhone(data.phone || "");
          setDateOfBirth(data.date_of_birth || "");
          setBloodType(data.blood_type || "");
          setAllergies(data.allergies || []);
          setChronicConditions(data.chronic_conditions || []);
        }
      });
    }
  }, [user]);

  const cpfMasked = formatMask(cpf, "cpf");
  const phoneMasked = formatMask(phone, "phone");

  const STEPS = [
    { id: "welcome", title: "Bem-vindo(a)! 🎉", icon: <Sparkles className="w-7 h-7" /> },
    { id: "personal", title: "Dados Pessoais", icon: <User className="w-7 h-7" /> },
    { id: "health", title: "Informações de Saúde", icon: <Heart className="w-7 h-7" /> },
    { id: "tour", title: "Como usar a plataforma", icon: <Video className="w-7 h-7" /> },
    { id: "done", title: "Tudo pronto! 💚", icon: <ArrowRight className="w-7 h-7" /> },
  ];

  const isLast = currentStep === STEPS.length - 1;
  const step = STEPS[currentStep];

  const addAllergy = () => {
    const v = allergyInput.trim();
    if (v && !allergies.includes(v)) {
      setAllergies(prev => [...prev, v]);
      setAllergyInput("");
    }
  };

  const addCondition = () => {
    const v = conditionInput.trim();
    if (v && !chronicConditions.includes(v)) {
      setChronicConditions(prev => [...prev, v]);
      setConditionInput("");
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      first_name: firstName,
      last_name: lastName,
      cpf: cpf.replace(/\D/g, ""),
      phone: phone.replace(/\D/g, ""),
      date_of_birth: dateOfBirth || null,
      blood_type: bloodType || null,
      allergies,
      chronic_conditions: chronicConditions,
    }).eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    }
    setSaving(false);
  };

  const handleNext = async () => {
    // Save data on step transitions from data-collection steps
    if (step.id === "personal" || step.id === "health") {
      await saveProfile();
    }
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

  const renderStepContent = () => {
    switch (step.id) {
      case "welcome":
        return (
          <div className="text-center">
            <img src={mascotWelcome} alt="Mascot" className="w-20 h-20 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-foreground mb-2">Bem-vindo(a) à AloClínica!</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sua saúde agora está a um clique de distância. Vamos preencher seus dados para personalizar sua experiência em poucos passos.
            </p>
          </div>
        );

      case "personal":
        return (
          <div className="text-left space-y-3">
            <h2 className="text-lg font-bold text-foreground text-center mb-1">Dados Pessoais</h2>
            <p className="text-xs text-muted-foreground text-center mb-3">Informações básicas para seu cadastro médico</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Nome *</Label>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Primeiro nome" className="mt-1 h-9 text-sm" />
              </div>
              <div>
                <Label className="text-xs">Sobrenome *</Label>
                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" className="mt-1 h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label className="text-xs">CPF</Label>
              <Input value={cpfMasked} onChange={e => setCpf(e.target.value.replace(/\D/g, ""))} placeholder="000.000.000-00" className="mt-1 h-9 text-sm" maxLength={14} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Telefone</Label>
                <Input value={phoneMasked} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="(00) 00000-0000" className="mt-1 h-9 text-sm" maxLength={15} />
              </div>
              <div>
                <Label className="text-xs">Data de nascimento</Label>
                <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="mt-1 h-9 text-sm" />
              </div>
            </div>
          </div>
        );

      case "health":
        return (
          <div className="text-left space-y-3">
            <h2 className="text-lg font-bold text-foreground text-center mb-1">Informações de Saúde</h2>
            <p className="text-xs text-muted-foreground text-center mb-3">Ajude o médico a te conhecer melhor</p>
            
            <div>
              <Label className="text-xs flex items-center gap-1"><Droplets className="w-3 h-3" /> Tipo Sanguíneo</Label>
              <Select value={bloodType} onValueChange={setBloodType}>
                <SelectTrigger className="mt-1 h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Alergias</Label>
              <div className="flex gap-2 mt-1">
                <Input value={allergyInput} onChange={e => setAllergyInput(e.target.value)} placeholder="Ex: Dipirona, Penicilina" className="h-9 text-sm flex-1"
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAllergy())} />
                <Button size="sm" variant="outline" onClick={addAllergy} className="h-9 px-2"><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {allergies.map(a => (
                    <Badge key={a} variant="secondary" className="text-xs gap-1 cursor-pointer hover:bg-destructive/20" onClick={() => setAllergies(prev => prev.filter(x => x !== a))}>
                      {a} <X className="w-2.5 h-2.5" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1"><Heart className="w-3 h-3" /> Condições Crônicas</Label>
              <div className="flex gap-2 mt-1">
                <Input value={conditionInput} onChange={e => setConditionInput(e.target.value)} placeholder="Ex: Diabetes, Hipertensão" className="h-9 text-sm flex-1"
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCondition())} />
                <Button size="sm" variant="outline" onClick={addCondition} className="h-9 px-2"><Plus className="w-3.5 h-3.5" /></Button>
              </div>
              {chronicConditions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {chronicConditions.map(c => (
                    <Badge key={c} variant="secondary" className="text-xs gap-1 cursor-pointer hover:bg-destructive/20" onClick={() => setChronicConditions(prev => prev.filter(x => x !== c))}>
                      {c} <X className="w-2.5 h-2.5" />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case "tour":
        return (
          <div className="text-center space-y-3">
            <h2 className="text-lg font-bold text-foreground mb-1">Como usar a plataforma</h2>
            <div className="space-y-2.5 text-left">
              {[
                { icon: <Search className="w-4 h-4 text-primary" />, title: "Busque médicos", desc: "Filtre por especialidade, preço e avaliação" },
                { icon: <Calendar className="w-4 h-4 text-secondary" />, title: "Agende online", desc: "Escolha dia e horário disponíveis" },
                { icon: <Video className="w-4 h-4 text-primary" />, title: "Consulte por vídeo", desc: "100% online, seguro e com privacidade" },
                { icon: <Upload className="w-4 h-4 text-warning" />, title: "Envie exames", desc: "Compartilhe documentos com seu médico" },
                { icon: <FileText className="w-4 h-4 text-secondary" />, title: "Receba receitas", desc: "Receitas e atestados digitais em PDF" },
              ].map(item => (
                <div key={item.title} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30 border border-border/30">
                  <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center shrink-0">{item.icon}</div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{item.title}</p>
                    <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "done":
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">Tudo pronto! 💚</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Seu perfil está completo. Agende sua primeira consulta e comece a cuidar da saúde com a AloClínica.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <Card className="border-border/60 shadow-xl overflow-hidden">
          <CardContent className="p-0">
            {/* Progress bar */}
            <div className="h-1 bg-muted">
              <motion.div className="h-full bg-gradient-to-r from-primary to-secondary" animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.3 }} />
            </div>

            {/* Skip */}
            <div className="flex justify-between items-center p-3 pb-0">
              <span className="text-[10px] text-muted-foreground">{currentStep + 1} de {STEPS.length}</span>
              <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                Pular <X className="w-3 h-3" />
              </button>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="px-6 pb-6 pt-2">
                {renderStepContent()}

                {/* Navigation */}
                <div className="flex gap-2 mt-5">
                  {currentStep > 0 && (
                    <Button variant="outline" size="sm" className="h-10" onClick={() => setCurrentStep(prev => prev - 1)}>
                      <ArrowLeft className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className={`flex-1 h-10 ${isLast ? "bg-gradient-hero text-primary-foreground" : ""}`}
                    onClick={handleNext}
                    disabled={saving}
                  >
                    {saving ? "Salvando..." : isLast ? (
                      <>Agendar primeira consulta <ArrowRight className="w-4 h-4 ml-1" /></>
                    ) : (
                      <>Próximo <ArrowRight className="w-4 h-4 ml-1" /></>
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
