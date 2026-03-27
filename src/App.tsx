import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/i18n";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner"; // used in unhandledrejection handler
import ErrorBoundary from "./components/ErrorBoundary";
const Index = lazy(() => import("./pages/Index"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProtectedRoute = lazy(() => import("@/components/auth/ProtectedRoute"));
import { logError } from "@/lib/logger";
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

import PingoLoader from "./components/PingoLoader";

// Lazy-load non-critical hooks to keep initial bundle small
const KeyboardShortcutsProvider = lazy(() =>
  import("./hooks/use-keyboard-shortcuts").then((m) => ({
    default: () => { m.useKeyboardShortcuts(); return null; },
  }))
);

const SubdomainRedirectProvider = lazy(() =>
  import("./hooks/use-subdomain-redirect").then((m) => ({
    default: () => { m.useSubdomainRedirect(); return null; },
  }))
);

const App = () => {
  const lastUnhandledToastRef = useRef(0);
  const [showDeferredFeatures, setShowDeferredFeatures] = useState(false);

  useEffect(() => {
    const timerId = window.setTimeout(() => setShowDeferredFeatures(true), 2500);
    return () => window.clearTimeout(timerId);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-app-mounted", "true");
    document.body.setAttribute("data-app-mounted", "true");
    document.getElementById("initial-loader")?.remove();
    window.dispatchEvent(new CustomEvent("app:mounted"));
  }, []);

  useEffect(() => {
    // Delay prefetching to avoid competing with initial render for main-thread time
    const timer = window.setTimeout(() => {
      const cancelCriticalPrefetch = prefetchOnIdle(
        [
          () => import("./pages/Auth"),
          () => import("./pages/AuthPaciente"),
          () => import("./pages/AuthMedico"),
        ],
        8000,
      );

      const cancelSecondaryPrefetch = prefetchOnIdle(
        [
          () => import("./pages/AuthAdmin"),
          () => import("./pages/AuthClinica"),
          () => import("./pages/AuthRecepcionista"),
          () => import("./pages/AuthSuporte"),
          () => import("./pages/AuthParceiro"),
          () => import("./pages/AuthLaudista"),
          () => import("./pages/GuestCheckout"),
          () => import("./pages/ForgotPassword"),
        ],
        20000,
      );

      cleanupRef.current = () => {
        cancelCriticalPrefetch();
        cancelSecondaryPrefetch();
      };
    }, 3000);

    const cleanupRef = { current: () => {} };
    return () => {
      window.clearTimeout(timer);
      cleanupRef.current();
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
                  <Suspense fallback={null}>
                    <KeyboardShortcutsProvider />
                    <SubdomainRedirectProvider />
                  </Suspense>
                  <ScrollToTop />
                  
                  <main id="main-content">
                    <Suspense fallback={<PingoLoader />}>
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

