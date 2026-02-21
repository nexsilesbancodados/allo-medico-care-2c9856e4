import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const LinkRedirect = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("Link inválido");
      return;
    }

    const redirect = async () => {
      // Try to find appointment by ID
      const { data: appt, error: apptErr } = await supabase
        .from("appointments")
        .select("id, jitsi_link, status, payment_status, access_token")
        .eq("id", id)
        .maybeSingle();

      if (apptErr || !appt) {
        setError("Consulta não encontrada. Verifique o link e tente novamente.");
        return;
      }

      // If payment pending, redirect to checkout
      if (appt.payment_status === "pending" && appt.status === "scheduled") {
        navigate(`/consulta-avulsa?appointment=${appt.id}`, { replace: true });
        return;
      }

      // If confirmed/in_progress, redirect to Jitsi room
      if (["confirmed", "in_progress"].includes(appt.status)) {
        const jitsiLink = appt.jitsi_link || `https://meet.jit.si/allo-medico-${appt.id}`;
        window.location.href = jitsiLink;
        return;
      }

      // If completed, redirect to rating
      if (appt.status === "completed") {
        navigate(`/rate/${appt.id}`, { replace: true });
        return;
      }

      // Default: go to dashboard
      navigate("/dashboard", { replace: true });
    };

    redirect();
  }, [id, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8">
          <p className="text-lg text-destructive font-medium">{error}</p>
          <a href="/" className="text-primary underline text-sm">Voltar ao início</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Redirecionando...</p>
      </div>
    </div>
  );
};

export default LinkRedirect;
