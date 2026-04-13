import { useEffect, forwardRef, lazy } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Brain } from "@phosphor-icons/react";
import { Stethoscope as StethoscopeLucide, Eye, Building2, ArrowRight, type LucideIcon } from "lucide-react";
import { useSiteConfig } from "@/lib/site-config";

import bannerAi from "@/assets/banner-ai-triage.webp";

// Icon name → component map (used to resolve string "icon" from CMS JSON)
const ICON_MAP: Record<string, LucideIcon> = {
  Stethoscope: StethoscopeLucide,
  Eye,
  Building2,
};

type EntryCard = {
  title: string;
  description: string;
  icon: string;
  cta: string;
  href: string;
  isClinic?: boolean;
};

const DEFAULT_ENTRY_CARDS: EntryCard[] = [
  { title: "Consulta Médica Online", description: "Fale por vídeo com médicos de diversas especialidades.", icon: "Stethoscope", cta: "Agendar agora", href: "/dashboard/doctors?type=telemedicina" },
  { title: "Consulta Oftalmológica",  description: "Avaliação com oftalmologista e teste de visão online.", icon: "Eye",         cta: "Ver oftalmologistas", href: "/dashboard/doctors?type=oftalmologia" },
  { title: "Sou clínica e quero enviar exame para laudo", description: "Envie exames e receba laudos de médicos especialistas.", icon: "Building2", cta: "Enviar exame", href: "/clinica/enviar-exame", isClinic: true },
];

function parseEntryCards(raw: string): EntryCard[] {
  if (!raw) return DEFAULT_ENTRY_CARDS;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as EntryCard[];
    return DEFAULT_ENTRY_CARDS;
  } catch {
    return DEFAULT_ENTRY_CARDS;
  }
}

// Lazy-load below-the-fold sections
const StatsSection = lazy(() => import("@/components/landing/StatsSection"));
const HorizontalScrollCards = lazy(() => import("@/components/landing/HorizontalScrollCards"));
const SpecialtiesShowcase = lazy(() => import("@/components/landing/SpecialtiesShowcase"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const TeleLaudoSection = lazy(() => import("@/components/landing/TeleLaudoSection"));
const BenefitsGrid = lazy(() => import("@/components/landing/BenefitsGrid"));
const HealthNetworkSection = lazy(() => import("@/components/landing/HealthNetworkSection"));
const InfoBannerStrip = lazy(() => import("@/components/landing/InfoBannerStrip"));
const PricingSection = lazy(() => import("@/components/landing/PricingSection"));
const ForDoctorsSection = lazy(() => import("@/components/landing/ForDoctorsSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const CTABanner = lazy(() => import("@/components/landing/CTABanner"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const Footer = lazy(() => import("@/components/landing/Footer"));

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get } = useSiteConfig();
  const entryCards = parseEntryCards(get("entry_cards", ""));

  useEffect(() => {
    const prev = theme;
    setTheme("light");
    return () => { if (prev && prev !== "light") setTheme(prev); };
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-[image:var(--landing-bg)] pointer-events-none" />
      <SEOHead
        title="Consultas Médicas Online por Vídeo 24h | AloClínica"
        description="Consulte médicos online por vídeo 24h. Agendamento fácil, receitas digitais válidas, 30+ especialidades, plantão clínico 24h. Sua saúde na palma da mão."
        canonical="https://aloclinica.com.br/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalOrganization",
          name: "AloClínica",
          url: "https://aloclinica.com.br",
          logo: "https://aloclinica.com.br/pwa-512x512.png",
          description: "Plataforma de telemedicina com consultas online por vídeo 24h, receitas digitais válidas e mais de 30 especialidades médicas.",
          medicalSpecialty: ["Cardiologia", "Dermatologia", "Endocrinologia", "Neurologia", "Oftalmologia", "Ortopedia", "Pediatria", "Clínica Geral"],
          areaServed: { "@type": "Country", name: "BR" },
          contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: ["Portuguese"], telephone: "+55-11-99999-0000" },
          sameAs: ["https://www.instagram.com/aloclinica", "https://www.facebook.com/aloclinica"],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Consultas Médicas",
            itemListElement: [
              { "@type": "Offer", name: "Consulta Avulsa", price: "89.00", priceCurrency: "BRL" },
              { "@type": "Offer", name: "Pronto-Atendimento 24h Diurno", price: "75.00", priceCurrency: "BRL" },
            ],
          },
          potentialAction: {
            "@type": "ReserveAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://aloclinica.com.br/paciente",
              actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
            },
            result: { "@type": "Reservation", name: "Consulta Médica Online" },
          },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "2500", bestRating: "5" },
        }}
      />
      <Header />
      <HeroSection />

      {/* Entry-point cards: route patient or clinic to the right place */}
      <section aria-label="Como podemos te ajudar" className="py-8 px-4">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="grid gap-4 sm:grid-cols-3">
            {entryCards.map((item) => {
              const Icon = ICON_MAP[item.icon] ?? StethoscopeLucide;
              const target = item.href;
              const handleClick = () => {
                if (item.isClinic) {
                  navigate(user ? target : "/auth");
                  return;
                }
                navigate(user ? target : `/auth?next=${encodeURIComponent(target)}`);
              };
              return (
                <Card
                  key={item.title}
                  onClick={handleClick}
                  className="group cursor-pointer border-border/40 hover:border-primary/40 hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5"
                >
                  <CardContent className="p-6 flex flex-col gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-extrabold text-foreground leading-tight mb-1 font-[Manrope]">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {item.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <SocialProofBar />

      {/* Stats counters */}
      <DeferredSection fallbackClassName="h-24" rootMargin="100px 0px">
        <StatsSection />
      </DeferredSection>

      {/* Plantão 24h banner */}
      <section className="py-8 px-4 relative overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-hero shadow-elevated">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary-foreground)/0.22),transparent_38%),radial-gradient(circle_at_bottom_right,hsl(var(--primary-foreground)/0.14),transparent_34%)]" />
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5 px-6 sm:px-10 py-7 sm:py-8">
              <div className="flex items-center gap-5 text-center sm:text-left">
                <div className="relative shrink-0 hidden sm:flex">
                  <div className="relative w-14 h-14 rounded-2xl bg-primary-foreground/15 flex items-center justify-center border border-primary-foreground/15 shadow-lg shadow-foreground/10">
                    <Stethoscope className="w-6 h-6 text-primary-foreground" weight="fill" />
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
                onClick={() => navigate(user ? "/dashboard/urgent-care" : "/paciente")}
              >
                <Stethoscope className="w-5 h-5" weight="fill" />
                Acessar Plantão
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Services showcase with hero image */}
      <DeferredSection fallbackClassName="h-screen" rootMargin="300px 0px">
        <HorizontalScrollCards />
      </DeferredSection>

      {/* Specialties grid — NEW */}
      <DeferredSection fallbackClassName="h-[520px]" rootMargin="200px 0px">
        <SpecialtiesShowcase />
      </DeferredSection>

      {/* How it works */}
      <DeferredSection fallbackClassName="h-[520px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <HowItWorksSection />
      </DeferredSection>

      {/* Telelaudo section */}
      <DeferredSection fallbackClassName="h-[520px]" rootMargin="200px 0px">
        <TeleLaudoSection />
      </DeferredSection>

      {/* AI Triage banner */}
      <DeferredSection fallbackClassName="h-36 mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <InfoBannerStrip
          icon={Brain}
          label="Inteligência Artificial"
          title="Triagem inteligente com IA"
          highlight="Descubra o especialista ideal em segundos"
          href="/teleconsulta"
          gradient="from-blue-600 to-primary"
          mascotSrc={bannerAi}
          variant="chevron"
        />
      </DeferredSection>

      {/* Benefits bento grid */}
      <DeferredSection fallbackClassName="h-[600px]" rootMargin="200px 0px">
        <BenefitsGrid />
      </DeferredSection>

      {/* Health network section */}
      <DeferredSection fallbackClassName="h-[500px]" rootMargin="200px 0px">
        <HealthNetworkSection />
      </DeferredSection>

      {/* Pricing */}
      <DeferredSection fallbackClassName="h-[640px]" rootMargin="200px 0px">
        <PricingSection />
      </DeferredSection>

      {/* For doctors */}
      <DeferredSection fallbackClassName="h-[540px]" rootMargin="200px 0px">
        <ForDoctorsSection />
      </DeferredSection>

      {/* Testimonials */}
      <DeferredSection fallbackClassName="h-[520px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <TestimonialsSection />
      </DeferredSection>

      {/* CTA comparison */}
      <DeferredSection fallbackClassName="h-[340px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <CTABanner />
      </DeferredSection>

      {/* FAQ */}
      <DeferredSection fallbackClassName="h-[560px] mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28">
        <FAQSection />
      </DeferredSection>

      <DeferredSection fallbackClassName="h-72 mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28" rootMargin="180px 0px">
        <Footer />
      </DeferredSection>

      <FloatingMobileCTA />
    </div>
  );
});
Index.displayName = "Index";
export default Index;
