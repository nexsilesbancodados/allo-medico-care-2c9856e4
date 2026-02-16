import { motion } from "framer-motion";
import { Stethoscope, Building2 } from "lucide-react";
import clinicReceptionist from "@/assets/clinic-receptionist.png";
import clinicPatientChat from "@/assets/clinic-patient-chat.png";
import logoImg from "@/assets/logo.png";

const steps = [
  { title: "Porta de entrada", desc: "Acesso pelo WhatsApp, app ou site da AloClinica, 24h por dia, 7 dias por semana." },
  { title: "Acolhimento", desc: "Triagem humanizada com profissionais qualificados para entender sua necessidade." },
  { title: "Atendimento", desc: "Consulta presencial ou por vídeo com médicos especialistas na própria clínica." },
  { title: "Encaminhamento", desc: "Exames, receitas digitais e acompanhamento contínuo do seu tratamento." },
];

const chatMessages = [
  { type: "sent", text: "Oi! Boa tarde!", time: "13:47" },
  { type: "received", text: "Olá! Boa tarde. Tudo bem com você? Bem-vinda à AloClinica.", time: "13:47" },
  { type: "received", text: "Aqui você vai encontrar um espaço para cuidar da sua saúde de um jeito fácil e completo.", time: "13:47" },
  { type: "received", text: "Para começar, me conta: você gostaria de agendar uma consulta presencial? Temos diversas especialidades disponíveis.", time: "13:48" },
];

const ClinicPresentialSection = () => {
  return (
    <section className="py-0 px-0">
      <div className="bg-[hsl(210,40%,15%)] dark:bg-[hsl(210,40%,10%)] text-white">
        {/* Top section */}
        <div className="container mx-auto px-4 pt-16 pb-12">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Text */}
            <div className="pt-8">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-block px-4 py-1 rounded-full bg-primary text-primary-foreground text-sm font-bold mb-6"
              >
                Novidade
              </motion.span>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="flex items-center gap-3 mb-6"
              >
                <Building2 className="w-10 h-10 text-primary" />
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold">
                  Clínica <span className="text-primary">AloClinica</span>
                </h2>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-white/70 text-lg max-w-lg mb-8 leading-relaxed"
              >
                Unimos atendimento presencial e digital com impacto direto na sua saúde. Consultas com especialistas na nossa clínica própria.
              </motion.p>
            </div>

            {/* Top image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className=""
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={clinicReceptionist}
                  alt="Recepcionista da clínica Alô Médico"
                  className="w-full h-48 sm:h-64 md:h-80 object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom section - Steps + Chat */}
        <div className="container mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-0"
            >
              {steps.map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="py-5 border-b border-white/10 last:border-b-0"
                >
                  <h3 className="text-xl font-bold text-white mb-1">{step.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Chat mockup + patient image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="relative"
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Patient image */}
                <div className="w-full sm:w-48 flex-shrink-0 rounded-2xl overflow-hidden shadow-xl">
                  <img
                    src={clinicPatientChat}
                    alt="Paciente agendando consulta"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Chat bubble */}
                <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 shadow-xl">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <Stethoscope className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-semibold text-sm">Clínica Alô Médico</span>
                  </div>

                  <div className="space-y-3 max-h-72 overflow-y-auto">
                    {chatMessages.map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.6 + i * 0.15 }}
                        className={`flex ${msg.type === "sent" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                            msg.type === "sent"
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-white/10 text-white/80 rounded-bl-sm"
                          }`}
                        >
                          <p>{msg.text}</p>
                          <span className={`text-[10px] mt-1 block text-right ${msg.type === "sent" ? "text-primary-foreground/60" : "text-white/40"}`}>
                            {msg.time}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ClinicPresentialSection;
