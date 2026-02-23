import { useEffect } from "react";
import { useTheme } from "next-themes";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SpecialtiesSection from "@/components/landing/SpecialtiesSection";
import PlansSection from "@/components/landing/PlansSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTABanner from "@/components/landing/CTABanner";
import DoctorPremiumSection from "@/components/landing/DoctorPremiumSection";
import VirtualAssistantSection from "@/components/landing/VirtualAssistantSection";
import MultiPlatformSection from "@/components/landing/MultiPlatformSection";
import ClinicPresentialSection from "@/components/landing/ClinicPresentialSection";
import FAQSection from "@/components/landing/FAQSection";
import SupportSection from "@/components/landing/SupportSection";
import Footer from "@/components/landing/Footer";

import AnimateSection from "@/components/ui/animate-section";
import EmergencyButton from "@/components/EmergencyButton";
import SpecialtyQuiz from "@/components/landing/SpecialtyQuiz";
import FloatingMobileCTA from "@/components/landing/FloatingMobileCTA";
import { Button } from "@/components/ui/button";
import { Stethoscope } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const { setTheme, theme } = useTheme();
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    const prev = theme;
    setTheme("light");
    return () => { if (prev && prev !== "light") setTheme(prev); };
  }, []);

  // Listen for quiz open event from FloatingMobileCTA
  useEffect(() => {
    const handler = () => setShowQuiz(true);
    window.addEventListener("open-specialty-quiz", handler);
    return () => window.removeEventListener("open-specialty-quiz", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background" style={{ background: 'var(--landing-bg)' }}>
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

      {/* Hero — above the fold */}
      <HeroSection />

      <AnimateSection delay={0.05}>
        <StatsSection />
      </AnimateSection>

      {/* 2. Entendimento do serviço */}
      <AnimateSection delay={0.0}>
        <HowItWorksSection />
      </AnimateSection>

      <AnimateSection delay={0.0} direction="up">
        <SpecialtiesSection />
      </AnimateSection>

      {/* 3. Diferenciais */}
      <AnimateSection direction="left">
        <VirtualAssistantSection />
      </AnimateSection>

      <AnimateSection direction="right">
        <MultiPlatformSection />
      </AnimateSection>

      <AnimateSection direction="left">
        <ClinicPresentialSection />
      </AnimateSection>

      {/* 4. Preços */}
      <AnimateSection direction="scale">
        <PlansSection />
      </AnimateSection>

      {/* 5. Para médicos */}
      <AnimateSection direction="right">
        <DoctorPremiumSection />
      </AnimateSection>

      {/* 6. Prova social */}
      <AnimateSection direction="up">
        <TestimonialsSection />
      </AnimateSection>

      {/* 7. Conversão final */}
      <AnimateSection direction="scale">
        <CTABanner />
      </AnimateSection>

      <AnimateSection direction="up">
        <FAQSection />
      </AnimateSection>

      <AnimateSection direction="up" delay={0.05}>
        <SupportSection />
      </AnimateSection>

      {/* Specialty Quiz CTA — prominent section */}
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
      <EmergencyButton />
      <FloatingMobileCTA />
      {showQuiz && <SpecialtyQuiz onClose={() => setShowQuiz(false)} />}
    </div>
  );
};

export default Index;
