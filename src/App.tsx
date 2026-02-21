import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AuthPaciente from "./pages/AuthPaciente";
import AuthMedico from "./pages/AuthMedico";
import AuthAdmin from "./pages/AuthAdmin";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GuestCheckout from "./pages/GuestCheckout";
import GuestConsultation from "./pages/GuestConsultation";
import AuthParceiro from "./pages/AuthParceiro";
import AuthAfiliado from "./pages/AuthAfiliado";
import AuthClinica from "./pages/AuthClinica";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PingoChatbot from "./components/PingoChatbot";
import AccessibilityToggle from "./components/AccessibilityToggle";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
            <Route path="/consulta-avulsa" element={<GuestCheckout />} />
            <Route path="/consulta" element={<GuestConsultation />} />
            <Route path="/parceiro" element={<AuthParceiro />} />
            <Route path="/afiliado" element={<AuthAfiliado />} />
            <Route path="/clinica" element={<AuthClinica />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
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
          <PingoChatbot />
          <AccessibilityToggle />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
