import { useEffect } from "react";
import { useTheme } from "next-themes";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
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
import PingoChatbot from "@/components/PingoChatbot";
import AnimateSection from "@/components/ui/animate-section";
import EmergencyButton from "@/components/EmergencyButton";
import SpecialtyQuiz from "@/components/landing/SpecialtyQuiz";
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

  return (
    <div className="min-h-screen bg-background" style={{ background: 'var(--landing-bg)' }}>
      <Header />

      {/* 1. Impacto inicial — sem animação (above the fold) */}
      <HeroSection />

      <SocialProofBar />

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

      {/* Specialty Quiz CTA */}
      <div className="text-center py-8">
        <Button
          size="lg"
          variant="outline"
          className="gap-2 text-base border-primary/30 hover:bg-primary/5"
          onClick={() => setShowQuiz(true)}
        >
          <Stethoscope className="w-5 h-5 text-primary" />
          Não sabe qual especialidade? Descubra aqui
        </Button>
      </div>

      <Footer />
      <PingoChatbot />
      <EmergencyButton />
      {showQuiz && <SpecialtyQuiz onClose={() => setShowQuiz(false)} />}
    </div>
  );
};

export default Index;
