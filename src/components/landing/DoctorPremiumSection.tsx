import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import doctorImg1 from "@/assets/doctor-premium-1.png";
import doctorImg2 from "@/assets/doctor-premium-2.png";

const DoctorPremiumSection = () => {
  const navigate = useNavigate();

  return (
    <section aria-label="Para médicos" className="py-10 md:py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-muted/60 dark:bg-muted/30 p-10 md:p-16"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div className="relative z-10">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="inline-block px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-semibold mb-6"
              >
                AloClinica Premium
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mb-6"
              >
                Modelo especial
                <br />
                para profissionais
                <br />
                da <span className="text-primary">saúde digital</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground text-lg max-w-md mb-8 leading-relaxed"
              >
                Um <strong className="text-foreground">formato exclusivo para médicos</strong> conectarem suas carreiras a novas possibilidades com a AloClinica.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <Button
                  size="lg"
                  className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-8 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  onClick={() => navigate("/medico")}
                >
                  Cadastre-se <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </motion.div>
            </div>

            {/* Images */}
            <div className="relative flex justify-center items-center min-h-[300px] lg:min-h-[400px]">
              <motion.div
                initial={{ opacity: 0, x: 20, rotate: -3 }}
                whileInView={{ opacity: 1, x: 0, rotate: -3 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="absolute top-0 left-2 sm:left-8 w-40 sm:w-52 lg:w-64 h-56 sm:h-72 lg:h-80 rounded-2xl overflow-hidden shadow-elevated z-10"
              >
                <img
                  src={doctorImg1}
                  alt="Médica profissional"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20, rotate: 3 }}
                whileInView={{ opacity: 1, x: 0, rotate: 3 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute bottom-0 right-2 sm:right-8 w-36 sm:w-48 lg:w-56 h-52 sm:h-64 lg:h-72 rounded-2xl overflow-hidden shadow-elevated z-20"
              >
                <img
                  src={doctorImg2}
                  alt="Médico atendendo online"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DoctorPremiumSection;
