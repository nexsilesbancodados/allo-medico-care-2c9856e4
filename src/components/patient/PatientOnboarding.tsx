import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Search, Upload, FileText, Heart, Video, ArrowRight, ArrowLeft, X, Sparkles, User, Droplets, AlertTriangle, Plus, Stethoscope, Ambulance, ClipboardList, ShieldCheck, Camera, CheckCircle2, Smartphone, Monitor } from "lucide-react";
import CpfInput from "@/components/ui/cpf-input";
import { useIsMobile } from "@/hooks/use-mobile";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import mascotWelcome from "@/assets/mascot-welcome.png";
import { formatMask } from "@/hooks/use-mask";
import { validarCPF } from "@/lib/cpf";

const ONBOARDING_KEY = "aloclinica_onboarding_completed";

interface PatientOnboardingProps {
  onComplete: () => void;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Não sei"];

const PatientOnboarding = ({ onComplete }: PatientOnboardingProps) => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "selfie" | "doc") => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Arquivo muito grande", { description: "Máximo 5 MB" }); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (type === "selfie") { setSelfieFile(file); setSelfiePreview(ev.target?.result as string); }
      else { setDocFile(file); setDocPreview(ev.target?.result as string); }
    };
    reader.readAsDataURL(file);
  };

  const uploadKYCFiles = async () => {
    if (!user) return;
    setSaving(true);
    try {
      if (selfieFile) {
        const ext = selfieFile.name.split(".").pop() || "jpg";
        await supabase.storage.from("avatars").upload(`${user.id}/kyc-selfie.${ext}`, selfieFile, { upsert: true });
      }
      if (docFile) {
        const ext = docFile.name.split(".").pop() || "jpg";
        await supabase.storage.from("avatars").upload(`${user.id}/kyc-document.${ext}`, docFile, { upsert: true });
      }
      // Also set selfie as avatar if user doesn't have one
      if (selfieFile && !profile?.avatar_url) {
        const ext = selfieFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar.${ext}`;
        await supabase.storage.from("avatars").upload(path, selfieFile, { upsert: true });
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
      }
      toast.success("Documentos enviados! ✅");
    } catch (err) {
      toast.error("Erro ao enviar", { description: "Tente novamente." });
    }
    setSaving(false);
  };

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
    { id: "welcome", title: "Bem-vindo(a)!" },
    { id: "personal", title: "Dados Pessoais" },
    { id: "health", title: "Informações de Saúde" },
    { id: "kyc", title: "Verificação de Identidade" },
    { id: "tour", title: "Como usar" },
    { id: "done", title: "Tudo pronto!" },
  ];

  const isLast = currentStep === STEPS.length - 1;
  const step = STEPS[currentStep];

  const addAllergy = () => {
    const v = allergyInput.trim();
    if (v && !allergies.includes(v)) { setAllergies(prev => [...prev, v]); setAllergyInput(""); }
  };
  const addCondition = () => {
    const v = conditionInput.trim();
    if (v && !chronicConditions.includes(v)) { setChronicConditions(prev => [...prev, v]); setConditionInput(""); }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      first_name: firstName, last_name: lastName,
      cpf: cpf.replace(/\D/g, ""), phone: phone.replace(/\D/g, ""),
      date_of_birth: dateOfBirth || null, blood_type: bloodType || null,
      allergies, chronic_conditions: chronicConditions,
    }).eq("user_id", user.id);
    setSaving(false);
  };

  const handleNext = async () => {
    if (step.id === "personal" || step.id === "health") await saveProfile();
    if (step.id === "kyc" && (selfieFile || docFile)) await uploadKYCFiles();
    if (isLast) { localStorage.setItem(ONBOARDING_KEY, "true"); onComplete(); }
    else setCurrentStep(prev => prev + 1);
  };

  const handleSkip = () => { localStorage.setItem(ONBOARDING_KEY, "true"); onComplete(); };

  const FEATURES = [
    { icon: <Stethoscope className="w-6 h-6 text-primary" />, title: "Consultas Médicas", desc: "Agende especialistas em poucos cliques." },
    { icon: <ClipboardList className="w-6 h-6 text-secondary" />, title: "Histórico", desc: "Seu prontuário sempre à mão." },
    { icon: <Ambulance className="w-6 h-6 text-destructive" />, title: "Emergência", desc: "Atendimento 24h prioritário." },
  ];

  const renderStep = () => {
    switch (step.id) {
      case "welcome":
        return (
          <div className="text-center px-2">
            <h1 className="text-3xl font-black text-foreground leading-tight mb-2">
              Sua saúde em <span className="italic">boas mãos.</span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Bem-vindo à AloClínica. O santuário digital para cuidar de você e de quem você ama.
            </p>
            <img src={mascotWelcome} alt="Pingo" className="w-40 h-40 mx-auto object-contain drop-shadow-lg mb-4" loading="lazy" decoding="async" width={160} height={160} />
            <div className="relative bg-card rounded-2xl border border-border/50 p-3 max-w-[200px] ml-auto -mt-8 mr-4 shadow-lg">
              <p className="text-xs text-foreground leading-relaxed">
                "Olá! Sou seu guia para uma vida saudável."
              </p>
              <div className="absolute -left-2 top-3 w-3 h-3 bg-card border-l border-b border-border/50 rotate-45" />
            </div>
          </div>
        );

      case "personal":
        return (
          <div className="text-left space-y-3">
            <h2 className="text-lg font-bold text-foreground text-center mb-1">Dados Pessoais</h2>
            <p className="text-xs text-muted-foreground text-center mb-3">Informações para seu cadastro médico</p>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Nome *</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Nome" className="mt-1 h-11 rounded-xl" /></div>
              <div><Label className="text-xs">Sobrenome *</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Sobrenome" className="mt-1 h-11 rounded-xl" /></div>
            </div>
            <div><Label className="text-xs">CPF</Label>
              <CpfInput value={cpf} onChange={setCpf} optional className="mt-1" inputClassName="h-11 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Telefone</Label><Input value={phoneMasked} onChange={e => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="(00) 00000-0000" className="mt-1 h-11 rounded-xl font-mono" maxLength={15} /></div>
              <div><Label className="text-xs">Nascimento</Label><Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="mt-1 h-11 rounded-xl" /></div>
            </div>
          </div>
        );

      case "health":
        return (
          <div className="text-left space-y-3">
            <h2 className="text-lg font-bold text-foreground text-center mb-1">Saúde</h2>
            <p className="text-xs text-muted-foreground text-center mb-3">Ajude o médico a te conhecer</p>
            <div>
              <Label className="text-xs flex items-center gap-1"><Droplets className="w-3 h-3" /> Tipo Sanguíneo</Label>
              <Select value={bloodType} onValueChange={setBloodType}>
                <SelectTrigger className="mt-1 h-11 rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{BLOOD_TYPES.map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Alergias</Label>
              <div className="flex gap-2 mt-1">
                <Input value={allergyInput} onChange={e => setAllergyInput(e.target.value)} placeholder="Ex: Dipirona" className="h-11 rounded-xl flex-1" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addAllergy())} />
                <Button size="sm" variant="outline" onClick={addAllergy} className="h-11 w-11 rounded-xl"><Plus className="w-4 h-4" /></Button>
              </div>
              <button type="button" onClick={() => { if (!allergies.includes("Nenhuma")) setAllergies(["Nenhuma"]); }} className="text-xs text-primary mt-1.5 hover:underline">Não tenho alergias</button>
              {allergies.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{allergies.map(a => (<Badge key={a} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setAllergies(prev => prev.filter(x => x !== a))}>{a} <X className="w-2.5 h-2.5" /></Badge>))}</div>}
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Heart className="w-3 h-3" /> Condições Crônicas</Label>
              <div className="flex gap-2 mt-1">
                <Input value={conditionInput} onChange={e => setConditionInput(e.target.value)} placeholder="Ex: Diabetes" className="h-11 rounded-xl flex-1" onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCondition())} />
                <Button size="sm" variant="outline" onClick={addCondition} className="h-11 w-11 rounded-xl"><Plus className="w-4 h-4" /></Button>
              </div>
              <button type="button" onClick={() => { if (!chronicConditions.includes("Nenhuma")) setChronicConditions(["Nenhuma"]); }} className="text-xs text-primary mt-1.5 hover:underline">Não tenho condições crônicas</button>
              {chronicConditions.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{chronicConditions.map(c => (<Badge key={c} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => setChronicConditions(prev => prev.filter(x => x !== c))}>{c} <X className="w-2.5 h-2.5" /></Badge>))}</div>}
            </div>
          </div>
        );

      case "kyc": {
        const kycMobileUrl = `${window.location.origin}/paciente?redirect=${encodeURIComponent("/dashboard?role=patient&onboarding=true&step=kyc")}`;
        const showQrOption = !isMobile && !selfiePreview && !docPreview;

        return (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Verificação de Identidade</h2>
              <p className="text-xs text-muted-foreground mt-1">Para sua segurança, envie uma selfie e um documento com foto.</p>
            </div>

            {/* QR Code for desktop users */}
            {showQrOption && (
              <div className="rounded-2xl border-2 border-dashed border-primary/30 p-5 bg-primary/5 text-center space-y-3">
                <div className="flex items-center justify-center gap-2 text-primary">
                  <Monitor className="w-5 h-5" />
                  <ArrowRight className="w-4 h-4" />
                  <Smartphone className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-foreground">Está no computador?</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Escaneie o QR Code abaixo com seu celular para tirar as fotos com a câmera do dispositivo.
                </p>
                <div className="flex justify-center py-2">
                  <div className="bg-white p-3 rounded-xl shadow-sm inline-block">
                    <QRCodeSVG value={kycMobileUrl} size={160} level="M" />
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">Ou envie arquivos do computador abaixo ↓</p>
              </div>
            )}

            {/* Selfie */}
            <div className="rounded-2xl border border-border/50 p-4 bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Selfie</p>
                  <p className="text-[11px] text-muted-foreground">Foto do seu rosto, bem iluminado</p>
                </div>
                {selfiePreview && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
              </div>
              {selfiePreview ? (
                <div className="relative">
                  <img src={selfiePreview} alt="Selfie" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => { setSelfieFile(null); setSelfiePreview(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border/60 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                  <Camera className="w-6 h-6 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">Tirar selfie agora</p>
                  <p className="text-[10px] text-muted-foreground/60">Câmera frontal obrigatória</p>
                  <input type="file" accept="image/*" capture="user" className="hidden" onChange={e => handleFileSelect(e, "selfie")} />
                </label>
              )}
            </div>

            {/* Document */}
            <div className="rounded-2xl border border-border/50 p-4 bg-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Documento com foto</p>
                  <p className="text-[11px] text-muted-foreground">RG, CNH ou passaporte</p>
                </div>
                {docPreview && <CheckCircle2 className="w-5 h-5 text-green-500 ml-auto" />}
              </div>
              {docPreview ? (
                <div className="relative">
                  <img src={docPreview} alt="Documento" className="w-full h-40 object-cover rounded-xl" />
                  <button onClick={() => { setDocFile(null); setDocPreview(null); }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 flex items-center justify-center">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed border-border/60 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
                  <Camera className="w-6 h-6 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">Fotografar documento</p>
                  <p className="text-[10px] text-muted-foreground/60">Câmera traseira obrigatória</p>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleFileSelect(e, "doc")} />
                </label>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              🔒 Seus documentos são protegidos por criptografia e armazenados em conformidade com a LGPD.
            </p>
          </div>
        );
      }

      case "tour":
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground text-center">O que você pode fazer</h2>
            {FEATURES.map(f => (
              <div key={f.title} className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/50">
                <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center shrink-0">{f.icon}</div>
                <div>
                  <p className="text-sm font-bold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
            {/* Highlight banner */}
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary-foreground/70">DESTAQUE DO MÊS</p>
              <p className="text-base font-bold mt-1">Check-up Preventivo</p>
              <p className="text-xs text-primary-foreground/70 mt-0.5">Incluso no seu plano AloClínica.</p>
              <Button variant="secondary" size="sm" className="mt-3 rounded-xl">Saber Mais</Button>
            </div>
          </div>
        );

      case "done":
        return (
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Tudo pronto! 💚</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Agende sua primeira consulta e comece a cuidar da saúde com a AloClínica.
            </p>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-2">
        <h2 className="text-lg font-extrabold text-primary italic">AloClínica</h2>
        <button onClick={handleSkip} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
          Pular
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 mb-4">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }} transition={{ duration: 0.3 }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{currentStep + 1} de {STEPS.length}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background border-t border-border/50 safe-bottom">
        <div className="flex gap-2 max-w-md mx-auto">
          {currentStep > 0 && (
            <Button variant="outline" className="h-13 rounded-xl px-4" onClick={() => setCurrentStep(prev => prev - 1)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          )}
          <Button
            className="flex-1 h-13 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/20"
            onClick={handleNext}
            disabled={saving}
          >
            {saving ? "Salvando..." : isLast ? "Começar Agora" : (
              <>Próximo <ArrowRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
        {isLast && (
          <p className="text-center text-xs text-muted-foreground mt-3">
            Já tem uma conta? <button onClick={handleSkip} className="text-primary font-semibold underline">Entrar</button>
          </p>
        )}
      </div>
    </div>
  );
};

export { ONBOARDING_KEY };
export default PatientOnboarding;
