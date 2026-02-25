import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Building2, Monitor, FileText, Stethoscope, Phone, CheckCircle2, ArrowRight, Shield, Users, Zap, BarChart2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";
import { z } from "zod";

const leadSchema = z.object({
  company_name: z.string().trim().min(2, "Nome da empresa obrigatório").max(200),
  contact_name: z.string().trim().min(2, "Nome do contato obrigatório").max(200),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
  company_type: z.string().min(1),
  message: z.string().max(2000).optional(),
});

const services = [
  { id: "telelaudo", label: "Telelaudo", icon: <FileText className="w-5 h-5" />, desc: "Laudos a distância" },
  { id: "teleconsulta", label: "Teleconsulta", icon: <Monitor className="w-5 h-5" />, desc: "Vídeo consultas" },
  { id: "plantao24h", label: "Plantão 24h", icon: <Phone className="w-5 h-5" />, desc: "SLA 15min" },
  { id: "whitelabel", label: "White Label", icon: <Building2 className="w-5 h-5" />, desc: "Sua marca" },
];

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const B2BLanding = () => {
  const [form, setForm] = useState({ company_name: "", contact_name: "", email: "", phone: "", cnpj: "", company_type: "clinic", message: "" });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleService = (id: string) => {
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse(form);
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    setSubmitting(true);
    const { error } = await supabase.from("b2b_leads").insert({ ...form, services_interested: selectedServices });
    if (error) { toast.error("Erro ao enviar: " + error.message); setSubmitting(false); return; }
    await supabase.functions.invoke("b2b-lead-notification", { body: { ...form, services_interested: selectedServices } }).catch(() => {});
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <>
      <SEOHead title="Telemedicina para Empresas | AloClinica" description="Soluções de teleconsulta, telelaudo e plantão 24h para clínicas e hospitais." />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="AloClinica" className="w-9 h-9 rounded-xl" />
              <span className="font-bold text-foreground text-lg tracking-tight">AloClínica</span>
            </Link>
            <Button variant="outline" className="rounded-xl font-semibold" asChild><Link to="/clinica">Acesso Clínica</Link></Button>
          </div>
        </header>

        {/* Hero — gradient */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-white/5 blur-3xl" />
          <div className="container mx-auto px-4 text-center relative">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-5 text-sm px-5 py-1.5 bg-white/15 text-white border-white/20 backdrop-blur-sm">🏢 Para Empresas</Badge>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-5 tracking-tight leading-tight">
                Telemedicina para sua<br /><span className="text-white/90">Clínica ou Hospital</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
                Teleconsulta, telelaudo e pronto-atendimento digital. Integre nossa plataforma ao seu fluxo de trabalho.
              </p>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-10 text-base font-bold shadow-2xl shadow-black/20" onClick={() => document.getElementById("form")?.scrollIntoView({ behavior: "smooth" })}>
                Solicitar Orçamento <ArrowRight className="w-5 h-5 ml-2" />
              </Button>

              {/* Trust metrics */}
              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-12">
                {[
                  { icon: <Shield className="w-4 h-4" />, label: "CFM Regulado" },
                  { icon: <Users className="w-4 h-4" />, label: "500+ Clínicas" },
                  { icon: <Zap className="w-4 h-4" />, label: "SLA 15min" },
                  { icon: <BarChart2 className="w-4 h-4" />, label: "99.9% Uptime" },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-2 text-white/60 text-sm font-medium">
                    {item.icon} {item.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Services — gradient icon cards */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-black text-foreground text-center mb-4 tracking-tight">Nossos Serviços B2B</motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">Soluções completas de telemedicina para sua operação</motion.p>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
                {[
                  { icon: <Stethoscope className="w-7 h-7 text-white" />, title: "Teleconsulta", desc: "Consultas por videochamada com receita digital", gradient: "from-primary to-primary/70" },
                  { icon: <FileText className="w-7 h-7 text-white" />, title: "Telelaudo", desc: "Laudos a distância com assinatura digital", gradient: "from-warning to-warning/70" },
                  { icon: <Phone className="w-7 h-7 text-white" />, title: "Plantão 24h", desc: "Pronto-atendimento digital SLA 15 min", gradient: "from-destructive to-destructive/70" },
                  { icon: <Building2 className="w-7 h-7 text-white" />, title: "White Label", desc: "Plataforma personalizada com sua marca", gradient: "from-secondary to-secondary/70" },
                ].map((s, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-xl hover:border-border hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                      <CardContent className="p-6">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {s.icon}
                        </div>
                        <h3 className="font-bold text-foreground text-lg mb-2">{s.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Form */}
        <section id="form" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-3xl font-black text-foreground text-center mb-3 tracking-tight">Solicite um Orçamento</h2>
            <p className="text-muted-foreground text-center mb-10">Entraremos em contato em até 24h úteis</p>

            {submitted ? (
              <Card className="border-success/30 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-success to-success/70 flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Orçamento solicitado!</h3>
                  <p className="text-muted-foreground">Nossa equipe entrará em contato em breve.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-xl border-border/50">
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa *</Label><Input required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" className="mt-1.5 h-11 rounded-xl" /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contato *</Label><Input required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email *</Label><Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                      <div>
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo *</Label>
                        <Select value={form.company_type} onValueChange={v => setForm(f => ({ ...f, company_type: v }))}>
                          <SelectTrigger className="mt-1.5 h-11 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="clinic">Clínica</SelectItem>
                            <SelectItem value="hospital">Hospital</SelectItem>
                            <SelectItem value="health_plan">Plano de Saúde</SelectItem>
                            <SelectItem value="other">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Serviços de Interesse</Label>
                      <div className="grid grid-cols-2 gap-2.5 mt-2">
                        {services.map(s => (
                          <div key={s.id} onClick={() => toggleService(s.id)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${selectedServices.includes(s.id) ? "border-primary bg-primary/5 shadow-sm" : "border-border/50 hover:border-border"}`}>
                            <Checkbox checked={selectedServices.includes(s.id)} className="shrink-0" />
                            <div className="min-w-0">
                              <span className="text-sm font-semibold text-foreground block">{s.label}</span>
                              <span className="text-[10px] text-muted-foreground">{s.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensagem</Label><Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Conte sobre as necessidades..." rows={3} className="mt-1.5 rounded-xl" /></div>
                    <Button type="submit" className="w-full h-13 rounded-xl bg-gradient-to-r from-primary via-primary to-secondary text-white font-bold text-base shadow-xl shadow-primary/20 hover:shadow-2xl transition-shadow" disabled={submitting}>
                      {submitting ? "Enviando..." : "Enviar Solicitação"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <footer className="py-8 border-t border-border/40 text-center text-xs text-muted-foreground">
          <p>© 2026 AloClinica · <Link to="/terms" className="hover:text-foreground transition-colors">Termos</Link> · <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link></p>
        </footer>
      </div>
    </>
  );
};

export default B2BLanding;
