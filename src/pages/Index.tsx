import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import SpecialtiesSection from "@/components/landing/SpecialtiesSection";
import PlansSection from "@/components/landing/PlansSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import FAQSection from "@/components/landing/FAQSection";
import SupportSection from "@/components/landing/SupportSection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <HowItWorksSection />
      <SpecialtiesSection />
      <PlansSection />
      <TestimonialsSection />
      <FAQSection />
      <SupportSection />
      <Footer />
    </div>
  );
};

export default Index;
