import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold">Alô Médico</span>
            </div>
            <p className="text-sm opacity-60 leading-relaxed">
              Plataforma completa de telemedicina. Conectando pacientes e médicos
              com segurança e praticidade.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider opacity-80">Plataforma</h4>
            <ul className="space-y-2 text-sm opacity-60">
              <li><a href="#como-funciona" className="hover:opacity-100 transition-opacity">Como funciona</a></li>
              <li><a href="#especialidades" className="hover:opacity-100 transition-opacity">Especialidades</a></li>
              <li><a href="#planos" className="hover:opacity-100 transition-opacity">Planos</a></li>
              <li><a href="#faq" className="hover:opacity-100 transition-opacity">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider opacity-80">Para Profissionais</h4>
            <ul className="space-y-2 text-sm opacity-60">
              <li><a href="#" className="hover:opacity-100 transition-opacity">Cadastro de Médicos</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Cadastro de Clínicas</a></li>
              <li><a href="#" className="hover:opacity-100 transition-opacity">Central de Ajuda</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4 text-sm uppercase tracking-wider opacity-80">Contato</h4>
            <ul className="space-y-3 text-sm opacity-60">
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> contato@alomedico.com.br</li>
              <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> 0800 123 4567</li>
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> São Paulo, SP</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs opacity-40">© 2026 Alô Médico. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-xs opacity-40">
            <a href="#" className="hover:opacity-100 transition-opacity">Termos de Uso</a>
            <a href="#" className="hover:opacity-100 transition-opacity">Política de Privacidade</a>
            <a href="#" className="hover:opacity-100 transition-opacity">LGPD</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
