import { useEffect, useState, forwardRef, lazy, Suspense } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import FloatingMobileCTA from "@/components/landing/FloatingMobileCTA";
import DeferredSection from "@/components/ui/deferred-section";
import { Button } from "@/components/ui/button";
import { Stethoscope, ShieldCheck, CreditCard, Brain, HeartPulse, FileText } from "lucide-react";

// Keep images as static imports but they'll be in separate chunks via asset pipeline
import bannerBenefits from "@/assets/banner-benefits-card.png";
import bannerAi from "@/assets/banner-ai-triage.png";
import bannerConsulta from "@/assets/banner-consulta.png";
import bannerPlantao from "@/assets/banner-plantao.png";
import bannerTelelaudo from "@/assets/banner-telelaudo.png";

// Lazy-load below-the-fold sections for faster initial paint
const InfoBannerStrip = lazy(() => import("@/components/landing/InfoBannerStrip"));
const StatsSection = lazy(() => import("@/components/landing/StatsSection"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const SpecialtiesSection = lazy(() => import("@/components/landing/SpecialtiesSection"));
const PlansSection = lazy(() => import("@/components/landing/PlansSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const CTABanner = lazy(() => import("@/components/landing/CTABanner"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const Footer = lazy(() => import("@/components/landing/Footer"));
const SpecialtyQuiz = lazy(() => import("@/components/landing/SpecialtyQuiz"));

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const { setTheme, theme } = useTheme();
  const [showQuiz, setShowQuiz] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const prev = theme;
    setTheme("light");
    return () => { if (prev && prev !== "light") setTheme(prev); };
  }, []);


  useEffect(() => {
    const handler = () => setShowQuiz(true);
    window.addEventListener("open-specialty-quiz", handler);
    return () => window.removeEventListener("open-specialty-quiz", handler);
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />
      <SEOHead
        title="Consultas Médicas Online por Vídeo 24h | AloClínica"
        description="Consulte médicos online por vídeo 24h. Agendamento fácil, receitas digitais válidas, 30+ especialidades, plantão clínico 24h. Sua saúde na palma da mão."
        canonical="https://allo-medico-care.lovable.app/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalOrganization",
          name: "AloClínica",
          url: "https://allo-medico-care.lovable.app",
          logo: "https://allo-medico-care.lovable.app/pwa-512x512.png",
          description: "Plataforma de telemedicina com consultas online por vídeo 24h, receitas digitais válidas e mais de 30 especialidades médicas.",
          medicalSpecialty: ["Cardiologia", "Dermatologia", "Endocrinologia", "Neurologia", "Oftalmologia", "Ortopedia", "Pediatria", "Clínica Geral"],
          areaServed: { "@type": "Country", name: "BR" },
          contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: ["Portuguese"], telephone: "+55-11-99999-0000" },
          sameAs: ["https://www.instagram.com/aloclinica", "https://www.facebook.com/aloclinica"],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Planos de Telemedicina",
            itemListElement: [
              { "@type": "Offer", name: "Consulta Avulsa", price: "89.00", priceCurrency: "BRL" },
              { "@type": "Offer", name: "Plantão 24h Diurno", price: "75.00", priceCurrency: "BRL" },
              { "@type": "Offer", name: "Cartão Desconto Individual", price: "24.90", priceCurrency: "BRL" },
            ],
          },
          potentialAction: {
            "@type": "ReserveAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://allo-medico-care.lovable.app/paciente",
              actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
            },
            result: { "@type": "Reservation", name: "Consulta Médica Online" },
          },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "2500", bestRating: "5" },
        }}
      />
      <Header />
      <HeroSection />
      <SocialProofBar />

      <section className="py-8 px-4 relative overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-hero shadow-elevated">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary-foreground)/0.22),transparent_38%),radial-gradient(circle_at_bottom_right,hsl(var(--primary-foreground)/0.14),transparent_34%)]" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5 px-6 sm:px-10 py-7 sm:py-8">
              <div className="flex items-center gap-5 text-center sm:text-left">
                <div className="relative shrink-0 hidden sm:flex">
                  <div className="relative w-14 h-14 rounded-2xl bg-primary-foreground/15 flex items-center justify-center border border-primary-foreground/15 shadow-lg shadow-foreground/10">
                    <Stethoscope className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary-foreground animate-pulse" />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-primary-foreground/70">Ao vivo agora</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-primary-foreground leading-tight">
                    Plantão Clínico 24h
                  </h2>
                  <p className="text-sm text-primary-foreground/80 mt-1 font-medium">
                    Médicos disponíveis agora · Sem agendamento
                  </p>
                </div>
              </div>

              <Button
                size="lg"
                className="bg-background text-primary hover:bg-background/95 rounded-2xl px-8 gap-2.5 shadow-lg shadow-foreground/10 font-extrabold shrink-0 transition-all text-sm sm:text-base"
                onClick={() => navigate(user ? "/dashboard/urgent-care" : "/consulta-avulsa")}
              >
                <Stethoscope className="w-5 h-5" />
                Acessar Plantão
              </Button>
            </div>
          </div>
        </div>
      </section>

      <DeferredSection fallbackClassName="h-28 mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28" rootMargin="180px 0px">
        <StatsSection />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-36 mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <InfoBannerStrip
          icon={ShieldCheck}
          label="Cartão de Benefícios"
          title="Economize até 30% em todas as consultas"
          highlight="A partir de R$37,90/mês"
          href="/cartao-beneficios"
          gradient="from-secondary to-emerald-600"
          mascotSrc={bannerBenefits}
        />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-[520px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <HowItWorksSection />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-36 mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <InfoBannerStrip
          icon={Brain}
          label="Inteligência Artificial"
          title="Triagem inteligente com IA"
          highlight="Descubra o especialista ideal em segundos"
          href="/teleconsulta"
          gradient="from-blue-600 to-primary"
          mascotSrc={bannerAi}
        />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-[620px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <SpecialtiesSection />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-36 mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <InfoBannerStrip
          icon={CreditCard}
          label="Consulta Avulsa"
          title="Consulte agora sem mensalidade"
          highlight="A partir de R$89 com receita digital"
          href="/consulta-avulsa"
          gradient="from-primary to-violet-600"
          mascotSrc={bannerConsulta}
        />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-[720px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <PlansSection />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-36 mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <InfoBannerStrip
          icon={HeartPulse}
          label="Plantão 24h"
          title="Precisa de atendimento urgente?"
          highlight="Médicos disponíveis agora"
          href="/consulta-avulsa"
          gradient="from-rose-500 to-primary"
          mascotSrc={bannerPlantao}
        />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-[520px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <TestimonialsSection />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-36 mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <InfoBannerStrip
          icon={FileText}
          label="Telelaudo"
          title="Laudos médicos à distância com IA"
          highlight="Para clínicas e hospitais"
          href="/telelaudo"
          gradient="from-amber-500 to-orange-600"
          mascotSrc={bannerTelelaudo}
        />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-[340px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <CTABanner />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-[560px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <FAQSection />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-[260px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28" rootMargin="220px 0px">
        <section aria-labelledby="triage-heading" className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
              <Stethoscope className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <h2 id="triage-heading" className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
              Não sabe qual especialidade procurar?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Nossa triagem inteligente analisa seus sintomas e sugere o especialista ideal em segundos.
            </p>
            <Button
              size="lg"
              className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-8 gap-2 text-base shadow-elevated"
              onClick={() => setShowQuiz(true)}
            >
              <Stethoscope className="w-5 h-5" aria-hidden="true" />
              Fazer Triagem Gratuita
            </Button>
          </div>
        </section>
      </DeferredSection>

      <DeferredSection fallbackClassName="h-72 mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28" rootMargin="180px 0px">
        <Footer />
      </DeferredSection>

      <FloatingMobileCTA />
      {showQuiz && (
        <Suspense fallback={null}>
          <SpecialtyQuiz onClose={() => setShowQuiz(false)} />
        </Suspense>
      )}
    </div>
  );
});
Index.displayName = "Index";
export default Index;
