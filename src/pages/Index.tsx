import { useEffect, useState, forwardRef } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import FloatingMobileCTA from "@/components/landing/FloatingMobileCTA";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SpecialtiesSection from "@/components/landing/SpecialtiesSection";
import PlansSection from "@/components/landing/PlansSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTABanner from "@/components/landing/CTABanner";
import FAQSection from "@/components/landing/FAQSection";
import Footer from "@/components/landing/Footer";
import SpecialtyQuiz from "@/components/landing/SpecialtyQuiz";

const Index = () => {
  const { setTheme, theme } = useTheme();
  const [showQuiz, setShowQuiz] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const prev = theme;
    setTheme("light");
    return () => { if (prev && prev !== "light") setTheme(prev); };
  }, []);

  // Capture affiliate referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (!refCode) return;

    try {
      sessionStorage.setItem("ref_code", refCode);
    } catch (error) {
      console.warn("Não foi possível salvar código de referência:", error);
    }
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

      {/* Plantão 24h Banner */}
      <section className="py-6 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary opacity-[0.06]" />
        <div className="container mx-auto max-w-4xl relative">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-xl shadow-primary/20">
            <div className="text-center sm:text-left">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2 justify-center sm:justify-start">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                Plantão Clínico 24h
              </h2>
              <p className="text-sm opacity-80 mt-1">Atendimento médico imediato, sem agendamento.</p>
            </div>
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90 rounded-full px-7 gap-2 shadow-lg font-semibold shrink-0"
              onClick={() => navigate(user ? "/dashboard/urgent-care" : "/consulta-avulsa")}
            >
              <Stethoscope className="w-4 h-4" />
              Acessar Plantão
            </Button>
          </div>
        </div>
      </section>

      <StatsSection />
      <HowItWorksSection />
      <SpecialtiesSection />
      <PlansSection />
      <TestimonialsSection />
      <CTABanner />
      <FAQSection />

      <section aria-labelledby="triage-heading" className="py-16 px-4">
        <div className="container mx-auto max-w-2xl text-center space-y-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
            <Stethoscope className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h2 id="triage-heading" className="text-2xl sm:text-3xl font-bold text-foreground">
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

      <FloatingMobileCTA />
      {showQuiz && (
        <SpecialtyQuiz onClose={() => setShowQuiz(false)} />
      )}
    </div>
  );
};

export default Index;
