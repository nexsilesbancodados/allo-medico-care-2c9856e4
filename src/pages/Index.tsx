import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import StatsSection from "@/components/landing/StatsSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SpecialtiesSection from "@/components/landing/SpecialtiesSection";
import PlansSection from "@/components/landing/PlansSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import CTABanner from "@/components/landing/CTABanner";
import DoctorPremiumSection from "@/components/landing/DoctorPremiumSection";
import FAQSection from "@/components/landing/FAQSection";
import SupportSection from "@/components/landing/SupportSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <StatsSection />
      <HowItWorksSection />
      <SpecialtiesSection />
      <PlansSection />
      <TestimonialsSection />
      <DoctorPremiumSection />
      <CTABanner />
      <FAQSection />
      <SupportSection />
      <Footer />
    </div>
  );
};

export default Index;
