import { useState, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Mail, MapPin, Phone, Instagram, Linkedin, Youtube, ArrowRight,
  Heart, Shield, Lock, Verified, Award, Sparkles, Globe, Smartphone,
  Stethoscope, Building2, Users, Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

const trustBadges = [
  { icon: Shield, label: "CFM Regulamentado", color: "text-primary" },
  { icon: Lock, label: "LGPD Compliant", color: "text-success" },
  { icon: Verified, label: "SSL Criptografado", color: "text-primary" },
  { icon: Award, label: "ISO 27001", color: "text-warning" },
];

const stats = [
  { icon: Stethoscope, value: "500+", label: "Médicos" },
  { icon: Users, value: "50K+", label: "Pacientes" },
  { icon: Building2, value: "100+", label: "Clínicas" },
  { icon: Clock, value: "99.9%", label: "Uptime" },
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

  return (
    <footer ref={ref} aria-label="Rodapé" className="relative bg-foreground text-background overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-primary/3 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Stats strip ── */}
      <div className="border-b border-background/8 relative">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="text-center group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2 group-hover:bg-primary/20 transition-colors duration-300">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-2xl font-black tracking-tight">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-widest opacity-40 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Newsletter CTA ── */}
      <div className="border-b border-background/8 relative">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Newsletter exclusiva
            </div>
            <h3 className="text-xl md:text-2xl font-bold mb-2">Fique por dentro das novidades</h3>
            <p className="text-sm opacity-45 mb-6 max-w-md mx-auto">
              Receba dicas de saúde, atualizações da plataforma e conteúdo exclusivo direto no seu e-mail.
            </p>
            <form onSubmit={handleNewsletter} className="flex gap-2 max-w-sm mx-auto">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-background/[0.06] border-background/10 text-background placeholder:text-background/30 rounded-xl h-12"
                required
              />
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary hover:bg-primary/90 rounded-xl h-12 px-6 shrink-0 font-semibold"
              >
                {submitting ? "..." : <><ArrowRight className="w-4 h-4" /></>}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>

      {/* ── Trust badges ── */}
      <div className="border-b border-background/8">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-background/[0.03] hover:bg-background/[0.06] transition-colors duration-200"
              >
                <badge.icon className={`w-4 h-4 ${badge.color}`} />
                <span className="text-xs font-semibold opacity-55">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main footer content ── */}
      <div className="container mx-auto px-4 py-14 relative">
        <div className="grid md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center p-1">
                <img src={logo} alt="AloClinica" className="w-full h-full rounded-lg object-contain" />
              </div>
              <div>
                <span className="text-lg font-bold block leading-tight">AloClinica</span>
                <span className="text-[10px] uppercase tracking-widest opacity-30 font-medium">Telemedicina</span>
              </div>
            </div>
            <p className="text-sm opacity-45 leading-relaxed mb-6 max-w-xs">
              Plataforma completa de telemedicina. Conectando pacientes e médicos
              com segurança, praticidade e tecnologia de ponta.
            </p>

            {/* Social */}
            <div className="flex gap-2 mb-6">
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
                  className="w-10 h-10 rounded-xl bg-background/[0.06] border border-background/8 flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Download badges */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold opacity-30 uppercase tracking-widest">Disponível em</p>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-background/[0.05] border border-background/8 text-xs font-medium hover:bg-background/[0.08] transition-colors cursor-default">
                  <Globe className="w-3.5 h-3.5 text-primary" /> PWA App
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-background/[0.05] border border-background/8 text-xs font-medium hover:bg-background/[0.08] transition-colors cursor-default">
                  <Smartphone className="w-3.5 h-3.5 text-primary" /> Mobile
                </div>
              </div>
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: "Plataforma",
              links: [
                { label: "Como funciona", href: "#como-funciona" },
                { label: "Especialidades", href: "#especialidades" },
                { label: "Planos", href: "#planos" },
                { label: "Cartão de Benefícios", to: "/cartao-beneficios" },
                { label: "Para Empresas", to: "/para-empresas" },
                { label: "FAQ", href: "#faq" },
              ],
            },
            {
              title: "Acesso",
              links: [
                { label: "Sou Paciente", to: "/paciente" },
                { label: "Sou Médico", to: "/medico" },
                { label: "Sou Laudista", to: "/laudista" },
                { label: "Sou Clínica", to: "/clinica" },
                { label: "Consulta Avulsa", to: "/consulta-avulsa" },
              ],
            },
            {
              title: "Contato",
              isContact: true,
              links: [],
            },
          ].map((col, ci) => (
            <div key={ci}>
              <h4 className="font-bold mb-5 text-xs uppercase tracking-widest opacity-60">{col.title}</h4>
              {col.isContact ? (
                <ul className="space-y-3.5 text-sm">
                  <li className="flex items-start gap-2.5 opacity-45 hover:opacity-70 transition-opacity">
                    <Mail className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                    <span>contato@aloclinica.com.br</span>
                  </li>
                  <li className="flex items-start gap-2.5 opacity-45 hover:opacity-70 transition-opacity">
                    <Phone className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                    <span>0800 123 4567</span>
                  </li>
                  <li className="flex items-start gap-2.5 opacity-45 hover:opacity-70 transition-opacity">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                    <span>São Paulo, SP — Brasil</span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-2.5 text-sm" role="list">
                  {col.links.map((link, li) => (
                    <li key={li}>
                      {"to" in link && link.to ? (
                        <Link to={link.to} className="opacity-45 hover:opacity-100 hover:text-primary transition-all duration-200 inline-block">
                          {link.label}
                        </Link>
                      ) : (
                        <a href={"href" in link ? link.href : "#"} className="opacity-45 hover:opacity-100 hover:text-primary transition-all duration-200 inline-block">
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        {/* Status bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 px-5 py-3 rounded-2xl bg-gradient-to-r from-background/[0.04] to-background/[0.02] border border-background/8 flex items-center justify-center gap-5 text-xs flex-wrap"
        >
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success" />
            </span>
            <span className="opacity-60 font-medium">Todos os sistemas operacionais</span>
          </span>
          <span className="opacity-15 hidden sm:inline">|</span>
          <span className="opacity-50">Plataforma 100% online</span>
          <span className="opacity-15 hidden sm:inline">|</span>
          <span className="opacity-50">Uptime 99.9%</span>
          <span className="opacity-15 hidden sm:inline">|</span>
          <span className="opacity-50">Latência &lt; 50ms</span>
        </motion.div>

        {/* Bottom bar */}
        <div className="border-t border-background/8 pt-8 flex flex-col md:flex-row justify-between items-center gap-5">
          <p className="text-xs opacity-30 flex items-center gap-1.5">
            © {new Date().getFullYear()} AloClinica. Feito com
            <Heart className="w-3 h-3 fill-current text-destructive inline" />
            no Brasil.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs">
            {[
              { label: "Termos de Uso", to: "/terms" },
              { label: "Privacidade", to: "/privacy" },
              { label: "LGPD", to: "/lgpd" },
              { label: "Cookies", to: "/cookies" },
              { label: "Reembolso", to: "/refund" },
              { label: "Termos Médicos", to: "/doctor-terms" },
              { label: "Acessibilidade", to: "/accessibility" },
            ].map(link => (
              <Link
                key={link.to}
                to={link.to}
                className="opacity-30 hover:opacity-80 hover:text-primary transition-all duration-200"
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
