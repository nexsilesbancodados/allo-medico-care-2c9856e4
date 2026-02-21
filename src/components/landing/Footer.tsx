import { motion } from "framer-motion";
import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer aria-label="Rodapé" className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 mb-4"
            >
              <img src={logo} alt="AloClinica" className="w-8 h-8 rounded-lg object-contain" />
              <span className="text-lg font-bold">AloClinica</span>
            </motion.div>
            <p className="text-sm opacity-60 leading-relaxed">
              Plataforma completa de telemedicina. Conectando pacientes e médicos
              com segurança e praticidade.
            </p>
          </div>

          {[
            {
              title: "Plataforma",
              links: [
                { label: "Como funciona", href: "#como-funciona" },
                { label: "Especialidades", href: "#especialidades" },
                { label: "Planos", href: "#planos" },
                { label: "FAQ", href: "#faq" },
              ],
            },
            {
              title: "Acesso",
              links: [
                { label: "Sou Paciente", to: "/paciente" },
                { label: "Sou Médico", to: "/medico" },
                { label: "Administração", to: "/admin" },
              ],
            },
          ].map((col, ci) => (
            <motion.div
              key={ci}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: ci * 0.1 + 0.1 }}
            >
              <h4 className="font-bold mb-4 text-sm uppercase tracking-wider opacity-80">{col.title}</h4>
              <ul className="space-y-2 text-sm opacity-60" role="list">
                {col.links.map((link, li) => (
                  <li key={li}>
                    {"to" in link ? (
                      <Link to={link.to!} className="hover:opacity-100 transition-opacity duration-200">{link.label}</Link>
                    ) : (
                      <a href={link.href} className="hover:opacity-100 transition-opacity duration-200">{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider opacity-80">Contato</h4>
            <ul className="space-y-3 text-sm opacity-60">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> contato@aloclinica.com.br</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 0800 123 4567</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> São Paulo, SP</li>
            </ul>
          </motion.div>
        </div>

        {/* Platform status bar */}
        <div className="mb-6 px-4 py-2.5 rounded-xl bg-background/5 border border-background/10 flex items-center justify-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="opacity-70">Operação: Normal</span>
          </span>
          <span className="opacity-30">|</span>
          <span className="opacity-70">Plataforma 100% online</span>
          <span className="opacity-30">|</span>
          <span className="opacity-70">Dados protegidos (LGPD)</span>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-40">© 2026 AloClinica. Todos os direitos reservados.</p>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs opacity-40">
            <Link to="/terms" className="hover:opacity-100 transition-opacity duration-200">Termos de Uso</Link>
            <Link to="/privacy" className="hover:opacity-100 transition-opacity duration-200">Privacidade</Link>
            <Link to="/lgpd" className="hover:opacity-100 transition-opacity duration-200">LGPD</Link>
            <Link to="/cookies" className="hover:opacity-100 transition-opacity duration-200">Cookies</Link>
            <Link to="/refund" className="hover:opacity-100 transition-opacity duration-200">Reembolso</Link>
            <Link to="/doctor-terms" className="hover:opacity-100 transition-opacity duration-200">Termos Médicos</Link>
            <Link to="/accessibility" className="hover:opacity-100 transition-opacity duration-200">Acessibilidade</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
