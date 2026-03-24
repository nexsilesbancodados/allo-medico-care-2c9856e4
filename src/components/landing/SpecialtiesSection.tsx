import { forwardRef } from "react";
import { Stethoscope, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import OptimizedImage from "@/components/ui/optimized-image";
import cardSpecialties from "@/assets/card-specialties.png";
import cardMultidisciplinary from "@/assets/card-multidisciplinary.png";
import cardAi from "@/assets/card-ai.png";
import cardTrained from "@/assets/card-trained.png";

const highlights = [
  { badge: "Cuidado completo", title: "Mais de 8 especialidades médicas disponíveis", image: cardSpecialties },
  { badge: "Cuidado multidisciplinar", title: "Nutricionistas, psicólogos, enfermeiros e mais.", image: cardMultidisciplinary },
  { badge: "Inteligência artificial", title: "O Pingo facilita sua utilização e garante a melhor experiência", image: cardAi },
  { badge: "Equipe capacitada", title: "Especialistas selecionados e treinados para atendimento online", image: cardTrained },
];

const SpecialtiesSection = forwardRef<HTMLElement>((_, ref) => {
  const navigate = useNavigate();

  return (
    <section ref={ref} id="especialidades" className="py-12 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 text-primary text-sm font-semibold mb-4">
            <Stethoscope className="w-3.5 h-3.5" />
            +20 especialidades
          </span>
          <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-3">
            Nossas <span className="text-gradient">especialidades</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Mais de 200 médicos e profissionais de saúde em uma vitrine clara, rápida e fácil de explorar.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-2 xl:grid-cols-4 md:overflow-visible md:gap-5">
          {highlights.map((item) => (
            <article
              key={item.title}
              className="group relative min-w-[272px] md:min-w-0 aspect-[4/5] rounded-[2rem] overflow-hidden border border-border/40 bg-card shadow-card"
            >
              <OptimizedImage
                src={item.image}
                alt={item.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                aspectRatio="4 / 5"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/25 to-transparent" />
              <div className="absolute inset-x-0 top-0 p-4 md:p-5">
                <span className="inline-flex rounded-full border border-background/30 bg-background/85 px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                  {item.badge}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                <h3 className="text-2xl font-extrabold leading-tight text-primary-foreground text-balance">
                  {item.title}
                </h3>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button
            size="lg"
            className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-8 font-bold shadow-lg hover:shadow-xl transition-all hover:scale-105 cta-shimmer group"
            onClick={() => navigate("/consulta-avulsa")}
          >
            Ver todas especialidades <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
});
SpecialtiesSection.displayName = "SpecialtiesSection";
export default SpecialtiesSection;
