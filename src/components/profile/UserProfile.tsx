import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Camera, Save, User } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { getPatientNav } from "@/components/patient/patientNav";
import { getAdminNav } from "@/components/admin/adminNav";
import { getReceptionNav } from "@/components/reception/receptionNav";

const roleLabels: Record<string, string> = {
  patient: "Paciente", doctor: "Médico", admin: "Administração",
  receptionist: "Recepção", support: "Suporte", clinic: "Clínica",
  partner: "Parceiro", affiliate: "Afiliado",
};

function getNavForRole(role: string) {
  switch (role) {
    case "doctor": return getDoctorNav("profile");
    case "patient": return getPatientNav("profile");
    case "admin": return getAdminNav("profile");
    case "receptionist": return getReceptionNav("profile");
    default: return [];
  }
}

const UserProfile = () => {
  const { user, profile, roles } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const forceRole = searchParams.get("role");
  const isAdmin = roles.includes("admin");
  const activeRole = isAdmin && forceRole ? forceRole
    : roles.includes("doctor") ? "doctor"
    : roles.includes("receptionist") ? "receptionist"
    : roles.includes("support") ? "support"
    : roles.includes("clinic") ? "clinic"
    : roles.includes("partner") ? "partner"
    : roles.includes("affiliate") ? "affiliate"
    : "patient";
  const nav = getNavForRole(activeRole);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [allergies, setAllergies] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [chronicConditions, setChronicConditions] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Doctor fields
  const [bio, setBio] = useState("");
  const [education, setEducation] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [consultationPrice, setConsultationPrice] = useState(89);
  const isDoctor = roles.includes("doctor");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setCpf(profile.cpf || "");
      setDateOfBirth(profile.date_of_birth || "");
      setAvatarUrl(profile.avatar_url);
      setAllergies(((profile as any).allergies ?? []).join(", "));
      setBloodType((profile as any).blood_type ?? "");
      setChronicConditions(((profile as any).chronic_conditions ?? []).join(", "));
    }
    if (isDoctor && user) fetchDoctorProfile();
  }, [profile, user]);

  const fetchDoctorProfile = async () => {
    const { data } = await supabase.from("doctor_profiles").select("bio, education, experience_years, consultation_price").eq("user_id", user!.id).single();
    if (data) {
      setBio(data.bio || "");
      setEducation(data.education || "");
      setExperienceYears(data.experience_years || 0);
      setConsultationPrice(Number(data.consultation_price) || 89);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(publicUrl);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    toast({ title: "Foto atualizada!" });
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const allergyArr = allergies.split(",").map(s => s.trim()).filter(Boolean);
    const conditionArr = chronicConditions.split(",").map(s => s.trim()).filter(Boolean);
    const { error } = await supabase.from("profiles").update({
      first_name: firstName, last_name: lastName, phone, cpf, date_of_birth: dateOfBirth || null,
      allergies: allergyArr, blood_type: bloodType || null, chronic_conditions: conditionArr,
    } as any).eq("user_id", user.id);

    if (isDoctor) {
      await supabase.from("doctor_profiles").update({
        bio, education, experience_years: experienceYears, consultation_price: consultationPrice,
      }).eq("user_id", user.id);
    }

    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
    }
  };

  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <DashboardLayout title={roleLabels[activeRole] ?? "Perfil"} nav={nav} role={activeRole}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <h1 className="text-2xl font-bold text-foreground mb-6">Meu Perfil</h1>

        {/* Avatar */}
        <Card className="border-border mb-6">
          <CardContent className="pt-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="relative shrink-0">
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl ?? undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:opacity-90 transition active:scale-95">
                <Camera className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </label>
            </div>
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground">{firstName} {lastName}</p>
              <p className="text-sm text-muted-foreground break-all">{user?.email}</p>
              {uploading && <p className="text-xs text-primary mt-1">Enviando foto...</p>}
            </div>
          </CardContent>
        </Card>

        {/* Personal info */}
        <Card className="border-border mb-6">
          <CardHeader><CardTitle className="text-lg">Dados Pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Nome</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} className="mt-1 h-11" /></div>
              <div><Label>Sobrenome</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} className="mt-1 h-11" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="mt-1 h-11" /></div>
              <div><Label>CPF</Label><Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" className="mt-1 h-11" /></div>
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Health info */}
        <Card className="border-border mb-6">
          <CardHeader><CardTitle className="text-lg">Dados de Saúde</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Tipo Sanguíneo</Label>
                <select value={bloodType} onChange={e => setBloodType(e.target.value)} className="mt-1 w-full h-11 rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Selecione</option>
                  {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <Label>Alergias</Label>
                <Input value={allergies} onChange={e => setAllergies(e.target.value)} placeholder="Ex: Dipirona, Penicilina" className="mt-1 h-11" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Separe por vírgula</p>
              </div>
            </div>
            <div>
              <Label>Condições Crônicas</Label>
              <Input value={chronicConditions} onChange={e => setChronicConditions(e.target.value)} placeholder="Ex: Diabetes, Hipertensão" className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Separe por vírgula</p>
            </div>
          </CardContent>
        </Card>

        {/* Doctor-specific */}
        {isDoctor && (
          <Card className="border-border mb-6">
            <CardHeader><CardTitle className="text-lg">Perfil Profissional</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Bio / Descrição</Label><textarea value={bio} onChange={e => setBio(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" rows={3} placeholder="Conte sobre sua experiência..." /></div>
              <div><Label>Formação</Label><Input value={education} onChange={e => setEducation(e.target.value)} placeholder="Ex: USP, Residência em Cardiologia" className="mt-1" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Anos de Experiência</Label><Input type="number" value={experienceYears} onChange={e => setExperienceYears(Number(e.target.value))} className="mt-1 h-11" min={0} /></div>
                <div><Label>Preço da Consulta (R$)</Label><Input type="number" value={consultationPrice} onChange={e => setConsultationPrice(Number(e.target.value))} className="mt-1 h-11" min={0} step={0.01} /></div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button onClick={handleSave} disabled={saving} className="bg-gradient-hero text-primary-foreground w-full sm:w-auto h-12 rounded-xl" size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;
