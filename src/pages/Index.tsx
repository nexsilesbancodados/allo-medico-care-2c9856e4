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

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* 1. Impacto inicial */}
      <HeroSection />
      <StatsSection />

      {/* 2. Entendimento do serviço */}
      <HowItWorksSection />
      <SpecialtiesSection />

      {/* 3. Diferenciais */}
      <VirtualAssistantSection />
      <MultiPlatformSection />
      <ClinicPresentialSection />

      {/* 4. Preços */}
      <PlansSection />

      {/* 5. Para médicos */}
      <DoctorPremiumSection />

      {/* 6. Prova social */}
      <TestimonialsSection />

      {/* 7. Conversão final */}
      <CTABanner />
      <FAQSection />
      <SupportSection />
      <Footer />
    </div>
  );
};

export default Index;
