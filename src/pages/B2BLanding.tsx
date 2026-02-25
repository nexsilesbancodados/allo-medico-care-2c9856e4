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
import { Building2, Monitor, FileText, Stethoscope, Phone, CheckCircle2, ArrowRight } from "lucide-react";
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
  { id: "telelaudo", label: "Telelaudo", icon: <FileText className="w-5 h-5" /> },
  { id: "teleconsulta", label: "Teleconsulta", icon: <Monitor className="w-5 h-5" /> },
  { id: "plantao24h", label: "Plantão 24h", icon: <Phone className="w-5 h-5" /> },
  { id: "whitelabel", label: "White Label", icon: <Building2 className="w-5 h-5" /> },
];

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
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from("b2b_leads").insert({
      ...form,
      services_interested: selectedServices,
    });

    if (error) {
      toast.error("Erro ao enviar: " + error.message);
      setSubmitting(false);
      return;
    }

    // Notify admin
    await supabase.functions.invoke("b2b-lead-notification", {
      body: { ...form, services_interested: selectedServices },
    }).catch(() => {});

    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <>
      <SEOHead title="Telemedicina para Empresas | AloClinica" description="Soluções de teleconsulta, telelaudo e plantão 24h para clínicas e hospitais. Solicite um orçamento." />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="AloClinica" className="w-8 h-8 rounded-lg" />
              <span className="font-bold text-foreground">AloClinica</span>
            </Link>
            <Button variant="outline" asChild><Link to="/clinica">Acesso Clínica</Link></Button>
          </div>
        </header>

        {/* Hero */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Badge className="mb-4 text-sm px-4 py-1">🏢 Para Empresas</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Telemedicina para sua <span className="text-primary">Clínica ou Hospital</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
                Teleconsulta, telelaudo e pronto-atendimento digital. Integre nossa plataforma ao seu fluxo de trabalho.
              </p>
              <Button size="lg" onClick={() => document.getElementById("form")?.scrollIntoView({ behavior: "smooth" })}>
                Solicitar Orçamento <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Services */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground text-center mb-10">Nossos Serviços B2B</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {[
                { icon: <Stethoscope className="w-8 h-8" />, title: "Teleconsulta", desc: "Consultas médicas por videochamada com receita digital" },
                { icon: <FileText className="w-8 h-8" />, title: "Telelaudo", desc: "Laudos médicos a distância com assinatura digital" },
                { icon: <Phone className="w-8 h-8" />, title: "Plantão 24h", desc: "Pronto-atendimento digital com SLA de 15 minutos" },
                { icon: <Building2 className="w-8 h-8" />, title: "White Label", desc: "Plataforma personalizada com a marca da sua empresa" },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                  <Card className="h-full text-center">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">{s.icon}</div>
                      <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                      <p className="text-sm text-muted-foreground">{s.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Form */}
        <section id="form" className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 max-w-2xl">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">Solicite um Orçamento</h2>

            {submitted ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">Orçamento solicitado!</h3>
                  <p className="text-muted-foreground">Entraremos em contato em até 24h úteis.</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Empresa *</Label>
                        <Input required value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
                      </div>
                      <div>
                        <Label>CNPJ</Label>
                        <Input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome do Contato *</Label>
                        <Input required value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Email *</Label>
                        <Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Telefone</Label>
                        <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <Label>Tipo de Empresa *</Label>
                        <Select value={form.company_type} onValueChange={v => setForm(f => ({ ...f, company_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Label>Serviços de Interesse</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {services.map(s => (
                          <div key={s.id} onClick={() => toggleService(s.id)}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${selectedServices.includes(s.id) ? "border-primary bg-primary/5" : "border-border"}`}>
                            <Checkbox checked={selectedServices.includes(s.id)} />
                            {s.icon}
                            <span className="text-sm">{s.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label>Mensagem</Label>
                      <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Conte mais sobre as necessidades da sua empresa..." rows={3} />
                    </div>
                    <Button type="submit" className="w-full h-12" disabled={submitting}>
                      {submitting ? "Enviando..." : "Enviar Solicitação de Orçamento"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        <footer className="py-8 border-t border-border text-center text-xs text-muted-foreground">
          <p>© 2026 AloClinica • <Link to="/terms" className="underline">Termos</Link> • <Link to="/privacy" className="underline">Privacidade</Link></p>
        </footer>
      </div>
    </>
  );
};

export default B2BLanding;
