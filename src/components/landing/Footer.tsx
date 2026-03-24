import { useState, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Mail, Phone, Instagram, Linkedin, Youtube, ArrowRight,
  Heart, Shield, Lock, Verified, Send
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import logo from "@/assets/mascot.png";

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
        toast.success("Inscrito com sucesso! 🎉");
      }
      setEmail("");
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer ref={ref} aria-label="Rodapé" className="bg-foreground text-background">
      {/* Top: Newsletter + Trust */}
      <div className="container mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-background/[0.06]">
        <form onSubmit={handleNewsletter} className="flex gap-2 w-full max-w-sm">
          <Input
            type="email"
            placeholder="Receba novidades — seu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-background/[0.06] border-background/10 text-background placeholder:text-background/30 rounded-xl h-10 text-sm"
            required
          />
          <Button type="submit" disabled={submitting} size="sm" className="rounded-xl h-10 px-4 shrink-0">
            {submitting ? "..." : <Send className="w-4 h-4" />}
          </Button>
        </form>
        <div className="flex items-center gap-4 text-[11px] text-background/40 font-medium">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-primary" /> CFM</span>
          <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-primary" /> LGPD</span>
          <span className="flex items-center gap-1.5"><Verified className="w-3.5 h-3.5 text-primary" /> SSL</span>
          <span className="flex items-center gap-2">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" /><span className="relative inline-flex rounded-full h-2 w-2 bg-success" /></span>
            Online
          </span>
        </div>
      </div>

      {/* Main */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="AloClinica" className="w-8 h-8 rounded-lg object-contain" />
              <span className="font-bold text-base">AloClinica</span>
            </div>
            <p className="text-xs text-background/35 leading-relaxed mb-4 max-w-[200px]">
              Telemedicina segura e acessível para todo o Brasil.
            </p>
            <div className="flex gap-2">
              {[
                { icon: Instagram, href: "https://instagram.com/aloclinica", label: "Instagram" },
                { icon: Linkedin, href: "https://linkedin.com/company/aloclinica", label: "LinkedIn" },
                { icon: Youtube, href: "https://youtube.com/@aloclinica", label: "YouTube" },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-8 h-8 rounded-lg bg-background/[0.05] border border-background/[0.06] flex items-center justify-center hover:bg-primary hover:border-primary hover:text-primary-foreground transition-all duration-200">
                  <s.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links columns */}
          {[
            { title: "Plataforma", links: [
              { label: "Como funciona", href: "#como-funciona" },
              { label: "Especialidades", href: "#especialidades" },
              { label: "Planos", href: "#planos" },
              { label: "Para Empresas", to: "/para-empresas" },
            ]},
            { title: "Acesso", links: [
              { label: "Paciente", to: "/paciente" },
              { label: "Médico", to: "/medico" },
              { label: "Laudista", to: "/laudista" },
              { label: "Clínica", to: "/clinica" },
            ]},
            { title: "Contato", contact: true, links: [] },
          ].map((col, ci) => (
            <div key={ci}>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.15em] text-background/40 mb-3">{col.title}</h4>
              {col.contact ? (
                <ul className="space-y-2 text-xs text-background/40">
                  <li className="flex items-center gap-2 hover:text-background/60 transition-colors"><Mail className="w-3.5 h-3.5 text-primary" /> contato@aloclinica.com.br</li>
                  <li className="flex items-center gap-2 hover:text-background/60 transition-colors"><Phone className="w-3.5 h-3.5 text-primary" /> 0800 123 4567</li>
                </ul>
              ) : (
                <ul className="space-y-1.5 text-xs">
                  {col.links.map((link, li) => (
                    <li key={li}>
                      {"to" in link && link.to ? (
                        <Link to={link.to} className="text-background/40 hover:text-primary transition-colors duration-200">{link.label}</Link>
                      ) : (
                        <a href={"href" in link ? link.href : "#"} className="text-background/40 hover:text-primary transition-colors duration-200">{link.label}</a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-background/[0.06]">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-background/25 flex items-center gap-1">
            © {new Date().getFullYear()} AloClinica — Feito com <Heart className="w-3 h-3 fill-current text-destructive" /> no Brasil
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px]">
            {[
              { label: "Termos", to: "/terms" },
              { label: "Privacidade", to: "/privacy" },
              { label: "LGPD", to: "/lgpd" },
              { label: "Cookies", to: "/cookies" },
              { label: "Reembolso", to: "/refund" },
            ].map(l => (
              <Link key={l.to} to={l.to} className="text-background/20 hover:text-primary transition-colors duration-200">{l.label}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});
Footer.displayName = "Footer";
export default Footer;
