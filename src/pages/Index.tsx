import { logError } from "@/lib/logger";
import { useEffect, useState, forwardRef, lazy, Suspense } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import FloatingMobileCTA from "@/components/landing/FloatingMobileCTA";
import InfoBannerStrip from "@/components/landing/InfoBannerStrip";
import { Button } from "@/components/ui/button";
import { Stethoscope, ShieldCheck, CreditCard, Brain, HeartPulse, FileText } from "lucide-react";
import bannerBenefits from "@/assets/banner-benefits-card.png";
import bannerAi from "@/assets/banner-ai-triage.png";
import bannerConsulta from "@/assets/banner-consulta.png";
import bannerPlantao from "@/assets/banner-plantao.png";
import bannerTelelaudo from "@/assets/banner-telelaudo.png";

// Lazy-load below-the-fold sections for faster initial paint
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
    <div className="min-h-screen relative bg-background">
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

      {/* Plantão 24h Banner — premium urgency */}
      <section className="py-6 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-[0.06]" />
        <div className="container mx-auto max-w-4xl relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden">
            {/* Animated shimmer overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
            <div className="text-center sm:text-left relative z-10">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center relative">
                  <Stethoscope className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white/90 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-white/90" />
                </div>
                Plantão Clínico 24h
              </h2>
              <p className="text-sm opacity-90 mt-1">Atendimento médico imediato, sem agendamento. Médicos disponíveis agora.</p>
            </div>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 rounded-full px-7 gap-2 shadow-lg font-bold shrink-0 hover:scale-[1.03] active:scale-[0.97] transition-all relative z-10"
              onClick={() => navigate(user ? "/dashboard/urgent-care" : "/consulta-avulsa")}
            >
              <Stethoscope className="w-4 h-4" />
              Acessar Plantão
            </Button>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <StatsSection />

        <InfoBannerStrip
          icon={ShieldCheck}
          label="Cartão de Benefícios"
          title="Economize até 30% em todas as consultas"
          highlight="A partir de R$37,90/mês"
          href="/cartao-beneficios"
          gradient="from-secondary to-emerald-600"
          mascotSrc={bannerBenefits}
        />

        <HowItWorksSection />

        <InfoBannerStrip
          icon={Brain}
          label="Inteligência Artificial"
          title="Triagem inteligente com IA"
          highlight="Descubra o especialista ideal em segundos"
          href="/teleconsulta"
          gradient="from-blue-600 to-primary"
          mascotSrc={bannerAi}
        />

        <SpecialtiesSection />

        <InfoBannerStrip
          icon={CreditCard}
          label="Consulta Avulsa"
          title="Consulte agora sem mensalidade"
          highlight="A partir de R$89 com receita digital"
          href="/consulta-avulsa"
          gradient="from-primary to-violet-600"
          mascotSrc={bannerConsulta}
        />

        <PlansSection />

        <InfoBannerStrip
          icon={HeartPulse}
          label="Plantão 24h"
          title="Precisa de atendimento urgente?"
          highlight="Médicos disponíveis agora"
          href="/consulta-avulsa"
          gradient="from-rose-500 to-primary"
          mascotSrc={bannerPlantao}
        />

        <TestimonialsSection />

        <InfoBannerStrip
          icon={FileText}
          label="Telelaudo"
          title="Laudos médicos à distância com IA"
          highlight="Para clínicas e hospitais"
          href="/telelaudo"
          gradient="from-amber-500 to-orange-600"
          mascotSrc={bannerTelelaudo}
        />

        <CTABanner />
        <FAQSection />

        <section aria-labelledby="triage-heading" className="py-16 px-4">
          <div className="container mx-auto max-w-2xl text-center space-y-5">
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

        <Footer />
      </Suspense>

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
