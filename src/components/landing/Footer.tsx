import { useState, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Mail, MapPin, Phone, Instagram, Linkedin, Youtube, ArrowRight, Heart, Shield, Lock, Verified, Award } from "lucide-react";
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
        if (error.code === "23505") {
          toast.info("Você já está inscrito! 📬");
        } else {
          toast.error("Erro ao inscrever. Tente novamente.");
        }
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
    <footer aria-label="Rodapé" className="bg-foreground text-background">
      {/* Trust badges strip */}
      <div className="border-b border-background/8">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {trustBadges.map((badge, i) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4 }}
                className="flex items-center gap-2.5"
              >
                <div className="w-8 h-8 rounded-lg bg-background/[0.06] flex items-center justify-center">
                  <badge.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-xs font-semibold opacity-60">{badge.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter strip */}
      <div className="border-b border-background/8">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            <div className="text-center md:text-left">
              <h3 className="text-lg font-bold mb-1">Fique por dentro</h3>
              <p className="text-sm opacity-50">Receba dicas de saúde e novidades da plataforma.</p>
            </div>
            <form onSubmit={handleNewsletter} className="flex gap-2 w-full max-w-sm">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-background/[0.06] border-background/10 text-background placeholder:text-background/30 rounded-xl h-11"
                required
              />
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-5 shrink-0">
                {submitting ? "..." : <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-14">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="AloClinica" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-lg font-bold">AloClinica</span>
            </div>
            <p className="text-sm opacity-50 leading-relaxed mb-5">
              Plataforma completa de telemedicina. Conectando pacientes e médicos
              com segurança e praticidade.
            </p>
            <div className="flex gap-2">
              {[
                { icon: Instagram, label: "Instagram", href: "https://instagram.com/aloclinica" },
                { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com/company/aloclinica" },
                { icon: Youtube, label: "YouTube", href: "https://youtube.com/@aloclinica" },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-background/[0.06] flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

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
                { label: "Sou Clínica", to: "/clinica" },
                { label: "Consulta Avulsa", to: "/consulta-avulsa" },
                { label: "Administração", to: "/admin" },
              ],
            },
          ].map((col, ci) => (
            <div key={ci}>
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider opacity-70">{col.title}</h4>
              <ul className="space-y-2.5 text-sm opacity-50" role="list">
                {col.links.map((link, li) => (
                  <li key={li}>
                    {"to" in link ? (
                      <Link to={link.to!} className="hover:opacity-100 transition-opacity duration-200 inline-block">{link.label}</Link>
                    ) : (
                      <a href={link.href} className="hover:opacity-100 transition-opacity duration-200 inline-block">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider opacity-70">Contato</h4>
            <ul className="space-y-3 text-sm opacity-50">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4 shrink-0" /> contato@aloclinica.com.br</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4 shrink-0" /> 0800 123 4567</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" /> São Paulo, SP</li>
            </ul>

            <div className="mt-6 space-y-2">
              <p className="text-xs font-semibold opacity-40 uppercase tracking-wider">Disponível em</p>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/[0.06] border border-background/8 text-xs font-medium">
                  🌐 PWA App
                </div>
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-background/[0.06] border border-background/8 text-xs font-medium">
                  📱 Mobile
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="mb-6 px-4 py-2.5 rounded-xl bg-background/[0.04] border border-background/8 flex items-center justify-center gap-4 text-xs flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="opacity-60">Operação: Normal</span>
          </span>
          <span className="opacity-20 hidden sm:inline">|</span>
          <span className="opacity-60">Plataforma 100% online</span>
          <span className="opacity-20 hidden sm:inline">|</span>
          <span className="opacity-60">Uptime 99.9%</span>
        </div>

        <div className="border-t border-background/8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-35 flex items-center gap-1">
            © 2026 AloClinica. Feito com <Heart className="w-3 h-3 fill-current text-destructive inline" /> no Brasil.
          </p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs opacity-35">
            <Link to="/terms" className="hover:opacity-100 transition-opacity">Termos de Uso</Link>
            <Link to="/privacy" className="hover:opacity-100 transition-opacity">Privacidade</Link>
            <Link to="/lgpd" className="hover:opacity-100 transition-opacity">LGPD</Link>
            <Link to="/cookies" className="hover:opacity-100 transition-opacity">Cookies</Link>
            <Link to="/refund" className="hover:opacity-100 transition-opacity">Reembolso</Link>
            <Link to="/doctor-terms" className="hover:opacity-100 transition-opacity">Termos Médicos</Link>
            <Link to="/accessibility" className="hover:opacity-100 transition-opacity">Acessibilidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";
export default Footer;
