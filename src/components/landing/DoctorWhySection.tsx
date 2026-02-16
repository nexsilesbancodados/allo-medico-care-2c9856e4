import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import doctorImg1 from "@/assets/doctor-signup-1.png";
import doctorImg2 from "@/assets/doctor-signup-2.png";

const cards = [
  {
    badge: "Cadastro Médico",
    title: "Cadastro para médicos especialistas e generalistas",
    image: doctorImg1,
    link: "#",
  },
  {
    badge: "Parceiro Clínica",
    title: "Cadastre sua clínica e amplie seus atendimentos",
    image: doctorImg2,
    link: "/clinica",
  },
];

const DoctorWhySection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-semibold mb-6">
              Médicos generalistas e especialistas
            </span>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-6">
              <span className="text-primary">O futuro</span> da saúde está aqui
            </h2>

            <p className="text-muted-foreground text-lg max-w-md mb-6 leading-relaxed">
              Confira as oportunidades disponíveis para todas as especialidades médicas na plataforma AloClinica, ou acesse o cadastro específico para sua categoria.
            </p>

            <p className="text-sm text-muted-foreground/70">
              Conheça o modelo exclusivo para profissionais que desejam expandir seus atendimentos.
            </p>
          </motion.div>

          {/* Cards */}
          <div className="flex gap-4 flex-col sm:flex-row">
            {cards.map((card, i) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.15, duration: 0.6 }}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => navigate(card.link)}
                className="relative flex-1 rounded-2xl overflow-hidden shadow-elevated cursor-pointer group min-h-[320px]"
              >
                {/* Image */}
                <img
                  src={card.image}
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold border border-white/20">
                    {card.badge}
                  </span>
                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-5 z-10 flex items-end justify-between">
                  <h3 className="text-white font-bold text-lg leading-snug max-w-[75%]">
                    {card.title}
                  </h3>
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 group-hover:bg-white/30 transition-colors flex-shrink-0">
                    <Plus className="w-5 h-5 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorWhySection;
