import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, FileText, Brain, Fingerprint, Zap, Upload, Building2, Clock, Shield, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import { z } from "zod";
import telelaudoSection from "@/assets/telelaudo-section.png";
import { lazy, Suspense } from "react";

const Footer = lazy(() => import("@/components/landing/Footer"));

const leadSchema = z.object({
  company_name: z.string().trim().min(2, "Nome da clínica obrigatório").max(200),
  contact_name: z.string().trim().min(2, "Nome do contato obrigatório").max(200),
  email: z.string().trim().email("Email inválido").max(255),
  phone: z.string().optional(),
  cnpj: z.string().optional(),
  message: z.string().max(2000).optional(),
});

const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } } };
const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

const B2BTelelaudo = () => {
  const [form, setForm] = useState({ company_name: "", contact_name: "", email: "", phone: "", cnpj: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = leadSchema.safeParse(form);
    if (!result.success) { toast.error(result.error.errors[0].message); return; }
    setSubmitting(true);
    const servicesInterested = ["telelaudo", "laudos_clinica"];
    const { error } = await supabase.from("b2b_leads").insert({ ...form, company_type: "clinica", services_interested: String(servicesInterested) });
    if (error) { toast.error("Erro ao enviar: " + error.message); setSubmitting(false); return; }
    await supabase.functions.invoke("b2b-lead-notification", { body: { ...form, services_interested: servicesInterested } }).catch(() => {});
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <>
      <SEOHead title="Telelaudo para Clínicas | AloClinica" description="Terceirize laudos médicos com segurança, IA de triagem, assinatura digital SHA-256 e SLA de até 2 horas. Integração PACS/DICOM." />
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero */}
        <section className="relative overflow-hidden mt-[70px]" style={{ minHeight: "55vh" }}>
          <img src={telelaudoSection} alt="Telelaudo para clínicas" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-10" />
          <div className="container mx-auto px-4 relative z-20 flex items-end pb-12" style={{ minHeight: "55vh" }}>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-xl">
              <Badge className="mb-3 text-xs px-4 py-1 bg-white/15 text-white border-white/20 backdrop-blur-sm">
                <FileText className="w-3 h-3 mr-1" /> Para Clínicas
              </Badge>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight leading-tight text-left">
                Telelaudo<br /><span className="text-white/80">para sua Clínica</span>
              </h1>
              <p className="text-sm text-white/70 max-w-lg mb-6 leading-relaxed text-left">
                Terceirize laudos médicos com segurança, agilidade e assinatura digital verificável. Sem equipe própria de laudistas.
              </p>
              <Button size="default" className="bg-white text-primary hover:bg-white/90 rounded-2xl px-8 font-bold shadow-2xl shadow-black/20" onClick={() => document.getElementById("form")?.scrollIntoView({ behavior: "smooth" })}>
                Solicitar Acesso <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <div className="flex flex-wrap items-start gap-4 mt-6">
                {[
                  { icon: <Zap className="w-3.5 h-3.5" />, label: "SLA < 2 horas" },
                  { icon: <Fingerprint className="w-3.5 h-3.5" />, label: "Assinatura Digital" },
                  { icon: <Brain className="w-3.5 h-3.5" />, label: "IA de Triagem" },
                  { icon: <Upload className="w-3.5 h-3.5" />, label: "PACS/DICOM" },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-1.5 text-white/50 text-xs font-medium">{item.icon} {item.label}</span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Como Funciona o Telelaudo</h2>
                <p className="text-muted-foreground mt-2 max-w-lg mx-auto">Laudos rápidos, seguros e verificáveis para sua clínica</p>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
                {[
                  { icon: <Upload className="w-7 h-7 text-white" />, title: "Upload Fácil", desc: "Envie exames pela plataforma ou integre via PACS/DICOM automaticamente.", gradient: "from-primary to-primary/70" },
                  { icon: <Brain className="w-7 h-7 text-white" />, title: "IA de Triagem", desc: "Classificação automática por urgência com sugestão inteligente de achados.", gradient: "from-warning to-warning/70" },
                  { icon: <Fingerprint className="w-7 h-7 text-white" />, title: "Assinatura Digital", desc: "Laudos com hash SHA-256, QR Code de verificação e rastreabilidade total.", gradient: "from-secondary to-secondary/70" },
                  { icon: <Zap className="w-7 h-7 text-white" />, title: "SLA < 2 horas", desc: "Laudos urgentes em até 2h, normais em até 24h com alertas de prazo.", gradient: "from-destructive to-destructive/70" },
                ].map((s, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-xl hover:border-border hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                      <CardContent className="p-6">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>{s.icon}</div>
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

        {/* Supported Exams */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Exames Atendidos</h2>
              </motion.div>
              <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {[
                  "Eletrocardiograma (ECG)",
                  "Raio-X e Tomografia",
                  "Ressonância Magnética",
                  "Eletroencefalograma (EEG)",
                  "Ultrassonografia",
                  "Espirometria",
                ].map((exam, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border/50 text-sm font-medium text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    {exam}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Advantages */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Por que Escolher a AloClinica?</h2>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  { icon: <Clock className="w-6 h-6" />, title: "Agilidade", desc: "Laudos entregues dentro do SLA, sem atrasos na operação da sua clínica" },
                  { icon: <Shield className="w-6 h-6" />, title: "Segurança Jurídica", desc: "Assinatura digital ICP-Brasil com verificação por QR Code" },
                  { icon: <Building2 className="w-6 h-6" />, title: "Sem Equipe Própria", desc: "Terceirize com especialistas sem custos fixos de contratação" },
                  { icon: <Stethoscope className="w-6 h-6" />, title: "Especialistas Qualificados", desc: "Laudistas com CRM verificado e experiência em suas modalidades" },
                  { icon: <Brain className="w-6 h-6" />, title: "IA Assistente", desc: "Sugestão de achados e estruturação automática de laudos por IA" },
                  { icon: <Upload className="w-6 h-6" />, title: "Integração PACS", desc: "Receba estudos DICOM automaticamente via webhook Orthanc" },
                ].map((item, i) => (
                  <motion.div key={i} variants={fadeUp} className="card-interactive flex items-start gap-4 p-5 rounded-2xl border border-border/50 hover:border-border hover:shadow-md transition-all">
                    <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center shrink-0 text-secondary">{item.icon}</div>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Contact Form */}
        <section id="form" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-xl">
            <h2 className="text-3xl font-black text-foreground text-center mb-3 tracking-tight">Solicitar Acesso</h2>
            <p className="text-muted-foreground text-center mb-8">Preencha seus dados e nossa equipe entrará em contato</p>

            {submitted ? (
              <Card className="border-success/30 shadow-xl">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-success to-success/70 flex items-center justify-center mx-auto mb-5 shadow-lg">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-foreground">Solicitação enviada!</h3>
                  <p className="text-muted-foreground">Nossa equipe entrará em contato em até 24h para configurar o Telelaudo na sua clínica.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-xl border-border/50">
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clínica *</Label><Input required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CNPJ</Label><Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" className="mt-1.5 h-11 rounded-xl" /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome do Contato *</Label><Input required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email *</Label><Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telefone</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1.5 h-11 rounded-xl" /></div>
                      <div><Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Exames/mês (estimativa)</Label><Input value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Ex: 50, 100, 500+" className="mt-1.5 h-11 rounded-xl" /></div>
                    </div>
                    <Button type="submit" className="w-full h-13 rounded-xl bg-gradient-to-r from-secondary to-primary text-primary-foreground font-bold text-base shadow-xl shadow-primary/20 hover:shadow-2xl transition-shadow" disabled={submitting}>
                      {submitting ? "Enviando..." : "Solicitar Acesso ao Telelaudo"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <Suspense fallback={null}><Footer /></Suspense>
      </div>
    </>
  );
};

export default B2BTelelaudo;
