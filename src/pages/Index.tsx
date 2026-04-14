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
import { Stethoscope } from "@phosphor-icons/react";
import { Stethoscope as StethoscopeLucide, Eye, Building2, ArrowRight, Wifi, Smartphone, LogIn, type LucideIcon } from "lucide-react";
import { useSiteConfig } from "@/lib/site-config";
import { useSiteSections } from "@/lib/site-sections";
import { motion } from "framer-motion";
import mockupPhoneHand from "@/assets/mockup-phone-hand.png";

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
const BenefitsGrid = lazy(() => import("@/components/landing/BenefitsGrid"));
const HealthNetworkSection = lazy(() => import("@/components/landing/HealthNetworkSection"));
const PricingSection = lazy(() => import("@/components/landing/PricingSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const CTABanner = lazy(() => import("@/components/landing/CTABanner"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const Footer = lazy(() => import("@/components/landing/Footer"));

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const { setTheme, theme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get } = useSiteConfig();
  const { enabled, configOf, sections } = useSiteSections();
  // If DB has seeded sections, use entry_cards from there; else fall back.
  const entryCardsFromDB = configOf<{ items?: EntryCard[] }>("entry_cards", { items: undefined });
  const entryCards = entryCardsFromDB.items && entryCardsFromDB.items.length > 0
    ? entryCardsFromDB.items
    : parseEntryCards(get("entry_cards", ""));
  // When sections not loaded yet, render everything (default).
  const isOn = (key: string) => sections ? enabled(key) : true;

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
      {isOn("header") && <Header />}
      {isOn("hero") && <HeroSection />}

      {/* ═══════════════ TELEMEDICINA É SIMPLES ═══════════════ */}
      <section className="py-0">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <div className="rounded-3xl overflow-hidden bg-primary/90 dark:bg-primary/80">
            <div className="grid lg:grid-cols-2 items-center">
              {/* Left — Phone mockup */}
              <motion.div
                className="flex justify-center items-end pt-10 lg:pt-0 px-8 lg:px-12"
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <img
                  src={mockupPhoneHand}
                  alt="App AloClínica no celular"
                  loading="lazy"
                  width={800}
                  height={1024}
                  className="w-[260px] md:w-[300px] lg:w-[340px] h-auto drop-shadow-2xl"
                />
              </motion.div>

              {/* Right — Text + checklist */}
              <motion.div
                className="p-8 md:p-12 lg:p-16"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
              >
                <div className="w-10 h-1 bg-primary-foreground/40 rounded-full mb-6" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-primary-foreground leading-tight mb-8">
                  Para se consultar via<br />Telemedicina é simples!
                </h2>

                <div className="space-y-6">
                  {[
                    { icon: <Wifi className="w-5 h-5" />, text: "Basta ter acesso a internet" },
                    { icon: <Smartphone className="w-5 h-5" />, text: "Um aparelho celular com câmera ou notebook" },
                    { icon: <LogIn className="w-5 h-5" />, text: "Fazer login através do Portal do Paciente" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.25 + i * 0.1 }}
                    >
                      <div className="w-12 h-12 rounded-full bg-primary-foreground/15 border border-primary-foreground/20 flex items-center justify-center shrink-0 text-primary-foreground">
                        {item.icon}
                      </div>
                      <p className="text-base md:text-lg font-semibold text-primary-foreground">
                        {item.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {isOn("footer") && <DeferredSection fallbackClassName="h-72 mx-4 sm:mx-6 lg:mx-12 xl:px-20 2xl:px-28" rootMargin="180px 0px">
        <Footer />
      </DeferredSection>}
    </div>
  );
});
Index.displayName = "Index";
export default Index;
