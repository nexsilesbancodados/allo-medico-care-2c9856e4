import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Phone, Mail, Lock, User, ArrowLeft, Stethoscope, Building2 } from "lucide-react";
import { Link } from "react-router-dom";

type UserType = "patient" | "doctor" | "clinic";
type AuthMode = "login" | "register" | "select-type";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [userType, setUserType] = useState<UserType>("patient");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [crm, setCrm] = useState("");
  const [crmState, setCrmState] = useState("SP");
  const [clinicName, setClinicName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: firstName, last_name: lastName },
      },
    });

    if (error) {
      setLoading(false);
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
      return;
    }

    // If user type is doctor or clinic, create additional profile
    if (data.user) {
      if (userType === "doctor") {
        await supabase.from("doctor_profiles").insert({
          user_id: data.user.id,
          crm,
          crm_state: crmState,
        });
        // Add doctor role
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "doctor" });
      } else if (userType === "clinic") {
        await supabase.from("clinic_profiles").insert({
          user_id: data.user.id,
          name: clinicName,
          cnpj,
        });
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "clinic" });
      }
    }

    setLoading(false);
    toast({
      title: "Cadastro realizado!",
      description: "Verifique seu email para confirmar a conta.",
    });
    navigate("/dashboard");
  };

  const userTypes = [
    { type: "patient" as UserType, icon: User, label: "Paciente", desc: "Agende consultas e cuide da sua saúde" },
    { type: "doctor" as UserType, icon: Stethoscope, label: "Médico", desc: "Atenda pacientes por videochamada" },
    { type: "clinic" as UserType, icon: Building2, label: "Clínica", desc: "Gerencie seus médicos e atendimentos" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 opacity-80 hover:opacity-100 transition">
            <ArrowLeft className="w-4 h-4" />
            Voltar ao início
          </Link>
          <h1 className="text-4xl font-extrabold mb-4">AloClinica</h1>
          <p className="text-lg opacity-90">
            Sua plataforma completa de telemedicina. Consultas por vídeo com médicos
            qualificados, receitas digitais e muito mais.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground transition">
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          {mode === "login" && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo de volta</h2>
              <p className="text-muted-foreground mb-8">Entre na sua conta para continuar</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Não tem conta?{" "}
                <button onClick={() => setMode("select-type")} className="text-primary font-semibold hover:underline">
                  Cadastre-se
                </button>
              </p>
            </>
          )}

          {mode === "select-type" && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">Criar conta</h2>
              <p className="text-muted-foreground mb-8">Selecione o tipo de cadastro</p>

              <div className="space-y-3">
                {userTypes.map((ut) => (
                  <button
                    key={ut.type}
                    onClick={() => { setUserType(ut.type); setMode("register"); }}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border hover:border-primary hover:bg-muted/50 transition-all text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gradient-hero flex items-center justify-center text-primary-foreground">
                      <ut.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{ut.label}</p>
                      <p className="text-sm text-muted-foreground">{ut.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Já tem conta?{" "}
                <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">
                  Entrar
                </button>
              </p>
            </>
          )}

          {mode === "register" && (
            <>
              <button onClick={() => setMode("select-type")} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="w-3 h-3" /> Voltar
              </button>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Cadastro de {userTypes.find(u => u.type === userType)?.label}
              </h2>
              <p className="text-muted-foreground mb-6">Preencha seus dados para criar a conta</p>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nome</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nome" required className="mt-1" />
                  </div>
                  <div>
                    <Label>Sobrenome</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Sobrenome" required className="mt-1" />
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" required />
                  </div>
                </div>

                <div>
                  <Label>Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10" required minLength={6} />
                  </div>
                </div>

                {userType === "doctor" && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label>CRM</Label>
                      <Input value={crm} onChange={(e) => setCrm(e.target.value)} placeholder="123456" required className="mt-1" />
                    </div>
                    <div>
                      <Label>UF</Label>
                      <Input value={crmState} onChange={(e) => setCrmState(e.target.value)} placeholder="SP" required className="mt-1" maxLength={2} />
                    </div>
                  </div>
                )}

                {userType === "clinic" && (
                  <>
                    <div>
                      <Label>Nome da Clínica</Label>
                      <Input value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Clínica Saúde" required className="mt-1" />
                    </div>
                    <div>
                      <Label>CNPJ</Label>
                      <Input value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" className="mt-1" />
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" size="lg" disabled={loading}>
                  {loading ? "Criando conta..." : "Criar conta"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Já tem conta?{" "}
                <button onClick={() => setMode("login")} className="text-primary font-semibold hover:underline">
                  Entrar
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
