import { useState, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Mail, MapPin, Phone, Instagram, Linkedin, Youtube, ArrowRight,
  Heart, Shield, Lock, Verified, Award, Sparkles, Globe, Smartphone,
  Stethoscope, Building2, Users, Clock, ChevronRight, Send
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const trustBadges = [
  { icon: Shield, label: "CFM Regulamentado" },
  { icon: Lock, label: "LGPD Compliant" },
  { icon: Verified, label: "SSL Criptografado" },
  { icon: Award, label: "ISO 27001" },
];

const stats = [
  { icon: Stethoscope, value: "500+", label: "Médicos Ativos" },
  { icon: Users, value: "50K+", label: "Pacientes Atendidos" },
  { icon: Building2, value: "100+", label: "Clínicas Parceiras" },
  { icon: Clock, value: "99.9%", label: "Disponibilidade" },
];

const platformLinks = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Especialidades", href: "#especialidades" },
  { label: "Planos e Preços", href: "#planos" },
  { label: "Cartão de Benefícios", to: "/cartao-beneficios" },
  { label: "Para Empresas", to: "/para-empresas" },
  { label: "Perguntas Frequentes", href: "#faq" },
];

const accessLinks = [
  { label: "Sou Paciente", to: "/paciente" },
  { label: "Sou Médico", to: "/medico" },
  { label: "Sou Laudista", to: "/laudista" },
  { label: "Sou Clínica", to: "/clinica" },
  { label: "Consulta Avulsa", to: "/consulta-avulsa" },
];

const legalLinks = [
  { label: "Termos de Uso", to: "/terms" },
  { label: "Privacidade", to: "/privacy" },
  { label: "LGPD", to: "/lgpd" },
  { label: "Cookies", to: "/cookies" },
  { label: "Reembolso", to: "/refund" },
  { label: "Termos Médicos", to: "/doctor-terms" },
  { label: "Acessibilidade", to: "/accessibility" },
];

const Footer = forwardRef<HTMLElement>((_, ref) => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({ email: email.trim().toLowerCase() });
      if (error) {
        if (error.code === "23505") toast.info("Você já está inscrito! 📬");
        else toast.error("Erro ao inscrever. Tente novamente.");
      } else {
        toast.success("Inscrito com sucesso! 🎉", { description: "Você receberá nossas novidades." });
      }
      setEmail("");
    } catch {
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderLink = (link: { label: string; href?: string; to?: string }, idx: number) => {
    const cls = "group flex items-center gap-2 text-sm text-background/50 hover:text-primary transition-all duration-300";
    const arrow = <ChevronRight className="w-3 h-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />;
    return (
      <li key={idx}>
        {link.to ? (
          <Link to={link.to} className={cls}>{arrow}{link.label}</Link>
        ) : (
          <a href={link.href ?? "#"} className={cls}>{arrow}{link.label}</a>
        )}
      </li>
    );
  };

  return (
    <footer ref={ref} aria-label="Rodapé" className="relative bg-foreground text-background overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-secondary/[0.03] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-[150px]" />
      </div>

      {/* ── Stats Section ── */}
      <div className="relative border-b border-background/[0.06]">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                className="text-center group"
              >
                <div className="relative w-14 h-14 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-primary/10 transition-all duration-500" />
                  <div className="relative w-full h-full rounded-2xl flex items-center justify-center border border-primary/10 group-hover:border-primary/20 transition-colors duration-500">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-black tracking-tight bg-gradient-to-b from-background to-background/70 bg-clip-text text-transparent">
                  {stat.value}
                </p>
                <p className="text-[11px] uppercase tracking-[0.15em] text-background/35 font-semibold mt-1">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Newsletter CTA ── */}
      <div className="relative border-b border-background/[0.06]">
        <div className="container mx-auto px-4 py-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/15 to-secondary/10 border border-primary/10 text-primary text-xs font-bold mb-5 tracking-wide">
              <Sparkles className="w-3.5 h-3.5" /> NEWSLETTER EXCLUSIVA
            </div>
            <h3 className="text-2xl md:text-3xl font-bold mb-3 bg-gradient-to-r from-background via-background to-background/60 bg-clip-text text-transparent">
              Fique por dentro das novidades
            </h3>
            <p className="text-sm text-background/40 mb-8 max-w-md mx-auto leading-relaxed">
              Receba dicas de saúde, atualizações da plataforma e conteúdo exclusivo direto no seu e-mail.
            </p>
            <form onSubmit={handleNewsletter} className="relative max-w-md mx-auto">
              <div className="relative flex gap-2 p-1.5 rounded-2xl bg-background/[0.06] border border-background/[0.08] backdrop-blur-sm">
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-transparent border-0 text-background placeholder:text-background/25 rounded-xl h-12 focus-visible:ring-0 focus-visible:ring-offset-0 pl-4"
                  required
                />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl h-12 px-6 shrink-0 font-bold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
                >
                  {submitting ? "..." : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* ── Trust Badges ── */}
      <div className="relative border-b border-background/[0.06]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-3 md:gap-5">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background/[0.03] border border-background/[0.06] hover:bg-background/[0.06] hover:border-background/[0.1] transition-all duration-300 group"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-300">
                  <badge.icon className="w-3.5 h-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold text-background/50 group-hover:text-background/70 transition-colors duration-300">
                  {badge.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="container mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/10 flex items-center justify-center p-1.5">
                <img src={logo} alt="AloClinica" className="w-full h-full rounded-xl object-contain" />
              </div>
              <div>
                <span className="text-xl font-bold block leading-tight">AloClinica</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-background/30 font-bold">Telemedicina</span>
              </div>
            </div>
            <p className="text-sm text-background/40 leading-relaxed mb-8 max-w-xs">
              Plataforma completa de telemedicina. Conectando pacientes e médicos
              com segurança, praticidade e tecnologia de ponta.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3 mb-8">
              {[
                { icon: Instagram, label: "Instagram", href: "https://instagram.com/aloclinica" },
                { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/aloclinica" },
                { icon: Youtube, label: "YouTube", href: "https://youtube.com/@aloclinica" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="group relative w-11 h-11 rounded-xl bg-background/[0.04] border border-background/[0.06] flex items-center justify-center hover:bg-primary hover:border-primary transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-primary/20"
                >
                  <social.icon className="w-[18px] h-[18px] text-background/50 group-hover:text-primary-foreground transition-colors duration-300" />
                </a>
              ))}
            </div>

            {/* App badges */}
            <div className="space-y-2.5">
              <p className="text-[10px] font-bold text-background/25 uppercase tracking-[0.2em]">Disponível em</p>
              <div className="flex gap-2">
                {[
                  { icon: Globe, label: "PWA App" },
                  { icon: Smartphone, label: "Mobile" },
                ].map(app => (
                  <div key={app.label} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background/[0.04] border border-background/[0.06] text-xs font-semibold text-background/50 hover:bg-background/[0.07] hover:border-background/[0.1] transition-all duration-300 cursor-default">
                    <app.icon className="w-4 h-4 text-primary" /> {app.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Links */}
          <div className="lg:col-span-3">
            <h4 className="font-bold mb-6 text-[11px] uppercase tracking-[0.2em] text-background/50">Plataforma</h4>
            <ul className="space-y-3" role="list">
              {platformLinks.map(renderLink)}
            </ul>
          </div>

          {/* Access Links */}
          <div className="lg:col-span-2">
            <h4 className="font-bold mb-6 text-[11px] uppercase tracking-[0.2em] text-background/50">Acesso</h4>
            <ul className="space-y-3" role="list">
              {accessLinks.map(renderLink)}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h4 className="font-bold mb-6 text-[11px] uppercase tracking-[0.2em] text-background/50">Contato</h4>
            <ul className="space-y-4">
              {[
                { icon: Mail, text: "contato@aloclinica.com.br" },
                { icon: Phone, text: "0800 123 4567" },
                { icon: MapPin, text: "São Paulo, SP — Brasil" },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 group">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                    <item.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-background/45 group-hover:text-background/70 transition-colors duration-300 pt-2">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Status Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 p-4 rounded-2xl bg-gradient-to-r from-background/[0.04] via-background/[0.02] to-background/[0.04] border border-background/[0.06] flex items-center justify-center gap-6 text-xs flex-wrap"
        >
          <span className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success shadow-lg shadow-success/30" />
            </span>
            <span className="text-background/55 font-semibold">Todos os sistemas operacionais</span>
          </span>
          {["Plataforma 100% online", "Uptime 99.9%", "Latência < 50ms"].map((t, i) => (
            <span key={i} className="hidden sm:flex items-center gap-6">
              <span className="text-background/15">•</span>
              <span className="text-background/40">{t}</span>
            </span>
          ))}
        </motion.div>

        {/* ── Bottom Bar ── */}
        <div className="border-t border-background/[0.06] pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-background/30 flex items-center gap-1.5 font-medium">
            © {new Date().getFullYear()} AloClinica. Feito com
            <Heart className="w-3.5 h-3.5 fill-current text-destructive animate-pulse inline" />
            no Brasil.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs">
            {legalLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="text-background/25 hover:text-primary transition-all duration-300 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";
export default Footer;
