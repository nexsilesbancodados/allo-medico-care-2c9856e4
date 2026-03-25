import { useEffect, useRef, memo } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import card01 from "@/assets/marquee/card-01.jpg";
import card02 from "@/assets/marquee/card-02.jpg";
import card03 from "@/assets/marquee/card-03.jpg";
import card04 from "@/assets/marquee/card-04.jpg";
import card05 from "@/assets/marquee/card-05.jpg";
import card06 from "@/assets/marquee/card-06.jpg";
import card07 from "@/assets/marquee/card-07.jpg";
import card08 from "@/assets/marquee/card-08.jpg";
import card09 from "@/assets/marquee/card-09.jpg";
import card10 from "@/assets/marquee/card-10.jpg";
import card11 from "@/assets/marquee/card-11.jpg";
import card12 from "@/assets/marquee/card-12.jpg";
import card13 from "@/assets/marquee/card-13.jpg";
import card14 from "@/assets/marquee/card-14.jpg";
import card15 from "@/assets/marquee/card-15.jpg";
import card16 from "@/assets/marquee/card-16.jpg";

gsap.registerPlugin(ScrollTrigger);

interface CardData {
  image: string;
  badge: string;
  title: string;
  description: string;
}

const cards: CardData[] = [
  {
    image: card01,
    badge: "Dermatologia",
    title: "Cuidado com a Pele",
    description: "Consultas especializadas em dermatologia com diagnóstico digital avançado e acompanhamento contínuo.",
  },
  {
    image: card02,
    badge: "Oftalmologia",
    title: "Saúde Ocular",
    description: "Exames oftalmológicos completos com tecnologia de ponta e laudos à distância para clínicas.",
  },
  {
    image: card03,
    badge: "Neurologia",
    title: "Laudos por IA",
    description: "Telelaudo inteligente com análise de exames de imagem assistida por inteligência artificial.",
  },
  {
    image: card04,
    badge: "Clínica Geral",
    title: "Atendimento 24h",
    description: "Médicos disponíveis a qualquer hora do dia ou da noite para atendimento imediato por vídeo.",
  },
  {
    image: card05,
    badge: "Psicologia",
    title: "Bem-estar Mental",
    description: "Sessões de terapia online com profissionais qualificados no conforto da sua casa.",
  },
  {
    image: card06,
    badge: "Cardiologia",
    title: "Coração Saudável",
    description: "Acompanhamento cardiológico com monitoramento remoto e laudos de eletrocardiograma.",
  },
  {
    image: card07,
    badge: "Laboratório",
    title: "Exames Precisos",
    description: "Resultados de exames laboratoriais integrados diretamente ao seu prontuário digital.",
  },
  {
    image: card08,
    badge: "Fisioterapia",
    title: "Reabilitação Online",
    description: "Sessões de fisioterapia guiadas por vídeo com exercícios personalizados para sua recuperação.",
  },
  {
    image: card09,
    badge: "Ortopedia",
    title: "Saúde Articular",
    description: "Consultas ortopédicas com análise de exames de imagem e plano de tratamento personalizado.",
  },
  {
    image: card10,
    badge: "Cirurgia",
    title: "Pré-operatório",
    description: "Avaliação pré-cirúrgica completa com laudos e orientações detalhadas à distância.",
  },
  {
    image: card11,
    badge: "Nutrição",
    title: "Alimentação Saudável",
    description: "Planos alimentares personalizados com acompanhamento nutricional por teleconsulta.",
  },
  {
    image: card12,
    badge: "Telemedicina",
    title: "Consulta por Vídeo",
    description: "Atendimento médico de qualidade sem sair de casa, com receitas e atestados digitais válidos.",
  },
  {
    image: card13,
    badge: "Pediatria",
    title: "Cuidado Infantil",
    description: "Teleconsultas pediátricas com profissionais especializados no cuidado de crianças e adolescentes.",
  },
  {
    image: card14,
    badge: "Endocrinologia",
    title: "Equilíbrio Hormonal",
    description: "Acompanhamento endocrinológico com análise laboratorial integrada e plano terapêutico.",
  },
  {
    image: card15,
    badge: "Patologia",
    title: "Análises Clínicas",
    description: "Microscopia e análises patológicas com laudos digitais rápidos e precisos.",
  },
  {
    image: card16,
    badge: "Reabilitação",
    title: "Movimento & Saúde",
    description: "Programas de reabilitação personalizados com acompanhamento remoto e evolução monitorada.",
  },
];

function HorizontalScrollCards() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const getScrollDistance = () => {
      const trackWidth = track.scrollWidth;
      const screenWidth = window.innerWidth;
      const gap = screenWidth > 1024 ? 100 : 20;
      return Math.max(0, trackWidth - screenWidth + gap);
    };

    const ctx = gsap.context(() => {
      const distance = getScrollDistance();

      gsap.fromTo(
        track,
        { x: 0 },
        {
          x: -distance,
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${getScrollDistance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="h-screen overflow-hidden flex items-center bg-background relative"
      aria-label="Nossas especialidades"
    >
      {/* Ambient gradient overlays */}
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_left,hsl(var(--primary)/0.06),transparent_50%)]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--secondary)/0.06),transparent_50%)]"
        aria-hidden="true"
      />

      <div ref={trackRef} className="flex pl-[10vw] gap-6 md:gap-8 will-change-transform">
        {cards.map((card, i) => (
          <article
            key={i}
            className="min-w-[85vw] sm:min-w-[380px] md:min-w-[420px] h-[480px] md:h-[520px] rounded-3xl overflow-hidden relative flex flex-col justify-end shrink-0 shadow-xl group"
          >
            {/* Background image */}
            <img
              src={card.image}
              alt={card.title}
              loading={i < 4 ? "eager" : "lazy"}
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Gradient overlay for text readability */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
              aria-hidden="true"
            />
            {/* Content */}
            <div className="relative z-10 p-6 md:p-8 flex flex-col gap-3">
              <span className="inline-flex w-fit items-center rounded-full bg-primary/90 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground backdrop-blur-sm">
                {card.badge}
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                {card.title}
              </h3>
              <p className="text-sm text-white/80 leading-relaxed max-w-[340px]">
                {card.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default memo(HorizontalScrollCards);
