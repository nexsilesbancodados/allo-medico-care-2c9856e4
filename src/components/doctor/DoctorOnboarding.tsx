import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User, Stethoscope, DollarSign, CalendarDays, Video, ShieldCheck,
  CheckCircle2, ChevronRight, Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface OnboardingStep {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  path: string;
  check: (data: any) => boolean;
}

const steps: OnboardingStep[] = [
  {
    id: "profile",
    label: "Completar perfil",
    description: "Bio, foto e experiência",
    icon: User,
    path: "/dashboard/profile",
    check: (d) => !!d.docProfile?.bio && d.docProfile.bio.length > 10,
  },
  {
    id: "specialties",
    label: "Adicionar especialidades",
    description: "Selecione suas áreas",
    icon: Stethoscope,
    path: "/dashboard/profile",
    check: (d) => (d.specialtyCount ?? 0) > 0,
  },
  {
    id: "price",
    label: "Definir preço",
    description: "Valor da consulta",
    icon: DollarSign,
    path: "/dashboard/profile",
    check: (d) => !!d.docProfile?.consultation_price && Number(d.docProfile.consultation_price) > 0,
  },
  {
    id: "availability",
    label: "Configurar disponibilidade",
    description: "Pelo menos 1 horário",
    icon: CalendarDays,
    path: "/dashboard/availability",
    check: (d) => (d.slotCount ?? 0) > 0,
  },
  {
    id: "camera",
    label: "Testar câmera e microfone",
    description: "Verificação de hardware",
    icon: Video,
    path: "/dashboard/doctor/waiting-room",
    check: (d) => d.cameraChecked,
  },
  {
    id: "approval",
    label: "Aprovação do CRM",
    description: "Verificação administrativa",
    icon: ShieldCheck,
    path: "/dashboard/profile",
    check: (d) => !!d.docProfile?.is_approved,
  },
];

const CAMERA_CHECK_KEY = "doctor-camera-checked";

const DoctorOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [docRes, specRes, slotRes] = await Promise.all([
        supabase.from("doctor_profiles").select("id, bio, consultation_price, is_approved, crm_verified").eq("user_id", user.id).single(),
        supabase.from("doctor_specialties").select("id", { count: "exact", head: true }),
        supabase.from("availability_slots").select("id", { count: "exact", head: true }),
      ]);

      const docProfile = docRes.data;
      if (!docProfile) return;

      // Filter specialties for this doctor
      const { count: specialtyCount } = await supabase
        .from("doctor_specialties")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", docProfile.id);

      const { count: slotCount } = await supabase
        .from("availability_slots")
        .select("id", { count: "exact", head: true })
        .eq("doctor_id", docProfile.id);

      setData({
        docProfile,
        specialtyCount: specialtyCount ?? 0,
        slotCount: slotCount ?? 0,
        cameraChecked: localStorage.getItem(CAMERA_CHECK_KEY) === "true",
      });
    };
    fetchData();
  }, [user]);

  if (!data || dismissed) return null;

  const completedSteps = steps.filter(s => s.check(data));
  const percentage = Math.round((completedSteps.length / steps.length) * 100);

  if (percentage === 100) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5"
    >
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold text-foreground">Complete seu perfil</p>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                {percentage}%
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] text-muted-foreground h-6"
              onClick={() => setDismissed(true)}
            >
              Fechar
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground mb-3">
            Complete todos os passos para aparecer nas buscas de pacientes
          </p>

          <Progress value={percentage} className="h-1.5 mb-4" />

          <div className="space-y-1.5">
            {steps.map((step) => {
              const done = step.check(data);
              return (
                <button
                  key={step.id}
                  onClick={() => !done && navigate(step.path)}
                  disabled={done}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                    done
                      ? "bg-success/5 border border-success/20 opacity-70"
                      : "bg-card border border-border/40 hover:border-primary/30 hover:bg-primary/5 cursor-pointer"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    done ? "bg-success/15" : "bg-muted/60"
                  }`}>
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <step.icon className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${done ? "text-success line-through" : "text-foreground"}`}>
                      {step.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{step.description}</p>
                  </div>
                  {!done && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DoctorOnboarding;
