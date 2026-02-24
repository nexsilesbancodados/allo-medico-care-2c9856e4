import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/i18n";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PingoChatbot from "./components/PingoChatbot";
import OfflineIndicator from "./components/OfflineIndicator";
import ErrorBoundary from "./components/ErrorBoundary";
import CookieConsent from "./components/CookieConsent";
import { useKeyboardShortcuts } from "./hooks/use-keyboard-shortcuts";
import ScrollToTop from "./components/ScrollToTop";
import BackToTop from "./components/BackToTop";

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
const Dashboard = lazy(() => import("./pages/Dashboard"));
const GuestCheckout = lazy(() => import("./pages/GuestCheckout"));
const GuestConsultation = lazy(() => import("./pages/GuestConsultation"));
const GuestRating = lazy(() => import("./pages/GuestRating"));
const AuthParceiro = lazy(() => import("./pages/AuthParceiro"));
const AuthAfiliado = lazy(() => import("./pages/AuthAfiliado"));
const AuthClinica = lazy(() => import("./pages/AuthClinica"));
const AuthRecepcionista = lazy(() => import("./pages/AuthRecepcionista"));
const AuthSuporte = lazy(() => import("./pages/AuthSuporte"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LinkRedirect = lazy(() => import("./pages/LinkRedirect"));
const ValidateDocument = lazy(() => import("./pages/ValidateDocument"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const DoctorPublicProfilePage = lazy(() => import("./pages/DoctorPublicProfilePage"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const KeyboardShortcutsProvider = () => {
  useKeyboardShortcuts();
  return null;
};

const App = () => (
  <ErrorBoundary>
  <I18nProvider>
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <KeyboardShortcutsProvider />
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
            <Route path="/afiliado" element={<AuthAfiliado />} />
            <Route path="/clinica" element={<AuthClinica />} />
            <Route path="/recepcionista" element={<AuthRecepcionista />} />
            <Route path="/suporte" element={<AuthSuporte />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/convite/:code" element={<AuthPaciente />} />
            <Route path="/dr/:slug" element={<DoctorPublicProfilePage />} />
            <Route path="/l/:id" element={<LinkRedirect />} />
            <Route path="/validar/:id" element={<ValidateDocument />} />
            <Route path="/validar" element={<ValidateDocument />} />
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
          <PingoChatbot />
          <CookieConsent />
          <BackToTop />
          <OfflineIndicator />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
  </I18nProvider>
  </ErrorBoundary>
);

export default App;
