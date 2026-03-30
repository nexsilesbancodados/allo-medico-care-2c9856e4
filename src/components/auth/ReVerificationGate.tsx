import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BiometricKYC from "@/components/kyc/BiometricKYC";
import { ShieldCheck, AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const LAST_LOGIN_KEY = "aloclinica_last_login";
const REVERIFY_KEY = "aloclinica_reverified";
const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000;

/**
 * If a patient hasn't logged in for 60+ days, require facial re-verification
 * before allowing access to the dashboard.
 */
const ReVerificationGate = ({ children }: { children: React.ReactNode }) => {
  const { user, roles } = useAuth();
  const [needsReverification, setNeedsReverification] = useState(false);
  const [checking, setChecking] = useState(true);
  const [verified, setVerified] = useState(false);

  const isPatient = roles.includes("patient") && !roles.includes("admin") && !roles.includes("doctor");

  useEffect(() => {
    if (!user || !isPatient) {
      setChecking(false);
      return;
    }

    // Check if already re-verified this session
    const sessionKey = `${REVERIFY_KEY}_${user.id}`;
    if (sessionStorage.getItem(sessionKey) === "true") {
      setChecking(false);
      return;
    }

    // Get last login timestamp
    const lastLoginStr = localStorage.getItem(`${LAST_LOGIN_KEY}_${user.id}`);
    const now = Date.now();

    if (lastLoginStr) {
      const lastLogin = parseInt(lastLoginStr, 10);
      const daysSince = now - lastLogin;

      if (daysSince >= SIXTY_DAYS_MS) {
        // Check if user has a previous KYC verification
        supabase
          .from("kyc_verificacoes")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .limit(1)
          .then(({ data }) => {
            if (data?.length) {
              // Had KYC before — require re-verification
              setNeedsReverification(true);
            }
            setChecking(false);
          });
        return;
      }
    }

    // Update last login
    localStorage.setItem(`${LAST_LOGIN_KEY}_${user.id}`, now.toString());
    setChecking(false);
  }, [user, isPatient]);

  const handleComplete = () => {
    if (!user) return;
    setVerified(true);
    setNeedsReverification(false);
    sessionStorage.setItem(`${REVERIFY_KEY}_${user.id}`, "true");
    localStorage.setItem(`${LAST_LOGIN_KEY}_${user.id}`, Date.now().toString());
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (checking) return null;

  if (needsReverification && !verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="rounded-3xl border border-border/50 bg-card shadow-xl p-6 space-y-5">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-extrabold text-foreground font-[Manrope]">
                Reverificação necessária
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Faz mais de <strong>60 dias</strong> desde seu último acesso. 
                Por segurança, precisamos confirmar sua identidade com reconhecimento facial.
              </p>
            </div>

            {/* KYC Component */}
            <BiometricKYC
              onComplete={handleComplete}
              variant="full"
              tipo="paciente"
            />

            {/* Logout option */}
            <div className="pt-2 border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground hover:text-destructive gap-2"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Sair da conta
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ReVerificationGate;
