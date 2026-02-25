import { useEffect, lazy, Suspense, useState } from "react";
import { useTheme } from "next-themes";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import FloatingMobileCTA from "@/components/landing/FloatingMobileCTA";
import { SectionSkeleton, StatsSkeleton, TestimonialsSkeleton } from "@/components/landing/SectionSkeleton";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";

// Lazy load ALL below-the-fold sections
const StatsSection = lazy(() => import("@/components/landing/StatsSection"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const SpecialtiesSection = lazy(() => import("@/components/landing/SpecialtiesSection"));
const PlansSection = lazy(() => import("@/components/landing/PlansSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const CTABanner = lazy(() => import("@/components/landing/CTABanner"));
const DoctorPremiumSection = lazy(() => import("@/components/landing/DoctorPremiumSection"));
const VirtualAssistantSection = lazy(() => import("@/components/landing/VirtualAssistantSection"));
const MultiPlatformSection = lazy(() => import("@/components/landing/MultiPlatformSection"));
const ClinicPresentialSection = lazy(() => import("@/components/landing/ClinicPresentialSection"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const SupportSection = lazy(() => import("@/components/landing/SupportSection"));
const TeleLaudoSection = lazy(() => import("@/components/landing/TeleLaudoSection"));
const Footer = lazy(() => import("@/components/landing/Footer"));
const SpecialtyQuiz = lazy(() => import("@/components/landing/SpecialtyQuiz"));

const Index = () => {
  const { setTheme, theme } = useTheme();
  const [showQuiz, setShowQuiz] = useState(false);

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
        title="Consultas Médicas Online por Vídeo 24h"
        description="Consulte médicos online por vídeo 24h. Agendamento fácil, receitas digitais válidas, 30+ especialidades. Sua saúde na palma da mão."
        canonical="https://allo-medico-care.lovable.app/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalOrganization",
          name: "AloClinica",
          url: "https://allo-medico-care.lovable.app",
          logo: "https://allo-medico-care.lovable.app/pwa-512x512.png",
          description: "Plataforma de telemedicina com consultas online por vídeo 24h, receitas digitais válidas e mais de 30 especialidades médicas.",
          medicalSpecialty: ["Cardiologia", "Dermatologia", "Endocrinologia", "Neurologia", "Oftalmologia", "Ortopedia", "Pediatria", "Clínica Geral"],
          areaServed: { "@type": "Country", name: "BR" },
          contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: ["Portuguese"] },
          potentialAction: {
            "@type": "ReserveAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://allo-medico-care.lovable.app/paciente",
              actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
            },
            result: { "@type": "Reservation", name: "Consulta Médica Online" },
          },
        }}
      />
      <Header />
      <HeroSection />
      <SocialProofBar />

      <Suspense fallback={<><StatsSkeleton /><SectionSkeleton /><SectionSkeleton /><TestimonialsSkeleton /></>}>
        <StatsSection />
        <HowItWorksSection />
        <SpecialtiesSection />
        <VirtualAssistantSection />
        <MultiPlatformSection />
        <ClinicPresentialSection />
        <PlansSection />
        <DoctorPremiumSection />
        <TeleLaudoSection />
        <TestimonialsSection />
        <CTABanner />
        <FAQSection />
        <SupportSection />

        <section className="py-16 px-4">
          <div className="container mx-auto max-w-2xl text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
              <Stethoscope className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
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
              <Stethoscope className="w-5 h-5" />
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
};

export default Index;
