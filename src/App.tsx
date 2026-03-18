import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/i18n";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
const Dashboard = lazy(() => import("./pages/Dashboard"));
import { logError } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import { useSubdomainRedirect } from "./hooks/use-subdomain-redirect";
import { prefetchOnIdle } from "./hooks/use-prefetch-route";
import ScrollToTop from "./components/ScrollToTop";

const AnalyticsScripts = lazy(() => import("./components/analytics/AnalyticsScripts"));
const Auth = lazy(() => import("./pages/Auth"));

// Lazy-loaded overlay components (not needed on initial render)
const PingoChatbot = lazy(() => import("./components/PingoChatbot"));
const OfflineIndicator = lazy(() => import("./components/OfflineIndicator"));
const CookieConsent = lazy(() => import("./components/CookieConsent"));
const TermsReconsentDialog = lazy(() => import("./components/auth/TermsReconsentDialog"));
const PWAUpdateBanner = lazy(() => import("./components/PWAUpdateBanner"));

// Lazy-loaded pages for code splitting
const AuthPaciente = lazy(() => import("./pages/AuthPaciente"));
const AuthMedico = lazy(() => import("./pages/AuthMedico"));
const AuthAdmin = lazy(() => import("./pages/AuthAdmin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const LGPD = lazy(() => import("./pages/LGPD"));
const Cookies = lazy(() => import("./pages/Cookies"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const DoctorTerms = lazy(() => import("./pages/DoctorTerms"));
const Accessibility = lazy(() => import("./pages/Accessibility"));
const GuestCheckout = lazy(() => import("./pages/GuestCheckout"));
const GuestConsultation = lazy(() => import("./pages/GuestConsultation"));
const GuestRating = lazy(() => import("./pages/GuestRating"));
const AuthParceiro = lazy(() => import("./pages/AuthParceiro"));
const AuthClinica = lazy(() => import("./pages/AuthClinica"));
const AuthRecepcionista = lazy(() => import("./pages/AuthRecepcionista"));
const AuthSuporte = lazy(() => import("./pages/AuthSuporte"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LinkRedirect = lazy(() => import("./pages/LinkRedirect"));
const ValidateDocument = lazy(() => import("./pages/ValidateDocument"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const DoctorPublicProfilePage = lazy(() => import("./pages/DoctorPublicProfilePage"));
const DiscountCard = lazy(() => import("./pages/DiscountCard"));
const B2BCartao = lazy(() => import("./pages/B2BCartao"));
const B2BTelelaudo = lazy(() => import("./pages/B2BTelelaudo"));
const B2BLanding = lazy(() => import("./pages/B2BLanding"));
const Teleconsulta = lazy(() => import("./pages/Teleconsulta"));
const Telelaudo = lazy(() => import("./pages/Telelaudo"));
const AuthLaudista = lazy(() => import("./pages/AuthLaudista"));
const TelelaudoWorkspace = lazy(() => import("./pages/TelelaudoWorkspace"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => {
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowRecovery(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 px-4" role="status" aria-live="polite" aria-label="Carregando página">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      <p className="text-sm text-muted-foreground">Carregando com segurança...</p>
      {showRecovery && (
        <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
          Recarregar aplicativo
        </Button>
      )}
    </div>
  );
};

const KeyboardShortcutsProvider = () => {
  useKeyboardShortcuts();
  return null;
};

const SubdomainRedirectProvider = () => {
  useSubdomainRedirect();
  return null;
};

const App = () => {
  const lastUnhandledToastRef = useRef(0);
  const [showDeferredFeatures, setShowDeferredFeatures] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => setShowDeferredFeatures(true), 1200);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    const cancelCriticalPrefetch = prefetchOnIdle(
      [
        () => import("./pages/Auth"),
        () => import("./pages/AuthPaciente"),
        () => import("./pages/AuthMedico"),
        () => import("./pages/AuthAdmin"),
        () => import("./pages/AuthClinica"),
        () => import("./pages/AuthRecepcionista"),
        () => import("./pages/AuthSuporte"),
        () => import("./pages/AuthParceiro"),
        () => import("./pages/AuthLaudista"),
        () => import("./pages/GuestCheckout"),
        () => import("./pages/GuestConsultation"),
      ],
      1200,
    );

    const cancelSecondaryPrefetch = prefetchOnIdle(
      [
        () => import("./pages/ForgotPassword"),
        () => import("./pages/ResetPassword"),
        () => import("./pages/Terms"),
        () => import("./pages/Privacy"),
        () => import("./pages/LGPD"),
        () => import("./pages/Cookies"),
        () => import("./pages/RefundPolicy"),
        () => import("./pages/DoctorTerms"),
        () => import("./pages/Accessibility"),
        () => import("./pages/PaymentSuccess"),
        () => import("./pages/DoctorPublicProfilePage"),
        () => import("./pages/DiscountCard"),
        () => import("./pages/B2BLanding"),
        () => import("./pages/B2BCartao"),
        () => import("./pages/B2BTelelaudo"),
        () => import("./pages/Teleconsulta"),
        () => import("./pages/Telelaudo"),
        () => import("./pages/TelelaudoWorkspace"),
        () => import("./pages/ValidateDocument"),
        () => import("./pages/LinkRedirect"),
        () => import("./components/analytics/AnalyticsScripts"),
        () => import("./components/PingoChatbot"),
        () => import("./components/OfflineIndicator"),
        () => import("./components/CookieConsent"),
        () => import("./components/auth/TermsReconsentDialog"),
        () => import("./components/PWAUpdateBanner"),
      ],
      4000,
    );

    return () => {
      cancelCriticalPrefetch();
      cancelSecondaryPrefetch();
    };
  }, []);

  // Global safety net for unhandled async errors (prevents white screen)
  useEffect(() => {
    const NON_FATAL_REJECTION_RE = /AbortError|The user aborted a request|Network request failed while offline/i;
    const CHUNK_REJECTION_RE = /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i;

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const reasonText =
        reason instanceof Error
          ? `${reason.name}: ${reason.message}`
          : typeof reason === "string"
            ? reason
            : JSON.stringify(reason ?? "unknown");

      if (NON_FATAL_REJECTION_RE.test(reasonText) || CHUNK_REJECTION_RE.test(reasonText)) {
        return;
      }

      logError("Unhandled promise rejection", reason);

      const now = Date.now();
      if (now - lastUnhandledToastRef.current > 4000) {
        toast.error("Ocorreu um erro inesperado. Tente novamente.");
        lastUnhandledToastRef.current = now;
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    return () => window.removeEventListener("unhandledrejection", handleRejection);
  }, []);

  return (
    <ErrorBoundary>
      <I18nProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AuthProvider>
                  <KeyboardShortcutsProvider />
                  <SubdomainRedirectProvider />
                  <ScrollToTop />
                  <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium focus:shadow-lg"
                  >
                    Pular para o conteúdo
                  </a>
                  <main id="main-content">
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/paciente" element={<AuthPaciente />} />
                        <Route path="/medico" element={<AuthMedico />} />
                        <Route path="/admin" element={<AuthAdmin />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/terms" element={<Terms />} />
                        <Route path="/privacy" element={<Privacy />} />
                        <Route path="/lgpd" element={<LGPD />} />
                        <Route path="/cookies" element={<Cookies />} />
                        <Route path="/refund" element={<RefundPolicy />} />
                        <Route path="/doctor-terms" element={<DoctorTerms />} />
                        <Route path="/accessibility" element={<Accessibility />} />
                        <Route path="/consulta-avulsa" element={<GuestCheckout />} />
                        <Route path="/consulta" element={<GuestConsultation />} />
                        <Route path="/consulta/avaliacao" element={<GuestRating />} />
                        <Route path="/parceiro" element={<AuthParceiro />} />
                        <Route path="/clinica" element={<AuthClinica />} />
                        <Route path="/recepcionista" element={<AuthRecepcionista />} />
                        <Route path="/suporte" element={<AuthSuporte />} />
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/dr/:slug" element={<DoctorPublicProfilePage />} />
                        <Route path="/l/:id" element={<LinkRedirect />} />
                        <Route path="/validar/:id" element={<ValidateDocument />} />
                        <Route path="/validar" element={<ValidateDocument />} />
                        <Route path="/cartao-beneficios" element={<DiscountCard />} />
                        <Route path="/cartao-desconto" element={<Navigate to="/cartao-beneficios" replace />} />
                        <Route path="/para-empresas" element={<B2BLanding />} />
                        <Route path="/para-empresas/cartao" element={<B2BCartao />} />
                        <Route path="/para-empresas/telelaudo" element={<B2BTelelaudo />} />
                        <Route path="/teleconsulta" element={<Teleconsulta />} />
                        <Route path="/telelaudo" element={<Navigate to="/laudista" replace />} />
                        <Route path="/laudista" element={<AuthLaudista />} />
                        <Route path="/telelaudo-workspace" element={<ProtectedRoute><TelelaudoWorkspace /></ProtectedRoute>} />
                        <Route
                          path="/dashboard/*"
                          element={
                            <ProtectedRoute>
                              <Dashboard />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>

                  {showDeferredFeatures && (
                    <ErrorBoundary fallback={null}>
                      <Suspense fallback={null}>
                        <AnalyticsScripts />
                        <PingoChatbot />
                        <CookieConsent />
                        <TermsReconsentDialog />
                        <OfflineIndicator />
                        <PWAUpdateBanner />
                      </Suspense>
                    </ErrorBoundary>
                  )}
                </AuthProvider>
              </BrowserRouter>
            </TooltipProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
};

export default App;
