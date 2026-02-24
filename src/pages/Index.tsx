import { useEffect, lazy, Suspense } from "react";
import { useTheme } from "next-themes";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import AnimateSection from "@/components/ui/animate-section";
import FloatingMobileCTA from "@/components/landing/FloatingMobileCTA";
import patientPortalBg from "@/assets/patient-portal-bg.png";
import { SectionSkeleton, StatsSkeleton, TestimonialsSkeleton } from "@/components/landing/SectionSkeleton";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";
import { useState } from "react";

// Lazy load below-the-fold sections for faster initial paint
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
    <div className="min-h-screen relative">
      {/* Fixed background image — same as login screen */}
      <img src={patientPortalBg} alt="" className="fixed inset-0 w-full h-full object-cover -z-10" />
      <div className="fixed inset-0 bg-background/60 -z-10" />
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
          medicalSpecialty: [
            "Cardiologia", "Dermatologia", "Endocrinologia", "Neurologia",
            "Oftalmologia", "Ortopedia", "Pediatria", "Clínica Geral",
          ],
          areaServed: { "@type": "Country", name: "BR" },
          contactPoint: {
            "@type": "ContactPoint",
            contactType: "customer service",
            availableLanguage: ["Portuguese"],
          },
          sameAs: [],
          potentialAction: {
            "@type": "ReserveAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://allo-medico-care.lovable.app/paciente",
              actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
            },
            result: {
              "@type": "Reservation",
              name: "Consulta Médica Online",
            },
          },
        }}
      />
      <Header />

      {/* Above the fold — no lazy loading */}
      <HeroSection />
      <SocialProofBar />

      {/* Below the fold — lazy loaded */}
      <Suspense fallback={<><StatsSkeleton /><SectionSkeleton /><SectionSkeleton /><TestimonialsSkeleton /></>}>
        <AnimateSection delay={0.05}>
          <StatsSection />
        </AnimateSection>

        <AnimateSection delay={0.0}>
          <HowItWorksSection />
        </AnimateSection>

        <AnimateSection delay={0.0} direction="up">
          <SpecialtiesSection />
        </AnimateSection>

        <AnimateSection direction="left">
          <VirtualAssistantSection />
        </AnimateSection>

        <AnimateSection direction="right">
          <MultiPlatformSection />
        </AnimateSection>

        <AnimateSection direction="left">
          <ClinicPresentialSection />
        </AnimateSection>

        <AnimateSection direction="scale">
          <PlansSection />
        </AnimateSection>

        <AnimateSection direction="right">
          <DoctorPremiumSection />
        </AnimateSection>

        <AnimateSection direction="up">
          <TestimonialsSection />
        </AnimateSection>

        <AnimateSection direction="scale">
          <CTABanner />
        </AnimateSection>

        <AnimateSection direction="up">
          <FAQSection />
        </AnimateSection>

        <AnimateSection direction="up" delay={0.05}>
          <SupportSection />
        </AnimateSection>

        <AnimateSection direction="scale" delay={0.05}>
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
        </AnimateSection>

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
