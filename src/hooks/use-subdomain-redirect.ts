import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

/**
 * Maps subdomains to their target routes.
 * Configure your Vercel domains accordingly:
 *   medico.aloclinica.com → /medico
 *   paciente.aloclinica.com → /paciente
 *   admin.aloclinica.com → /admin
 *   clinica.aloclinica.com → /clinica
 *   parceiro.aloclinica.com → /parceiro
 *   afiliado.aloclinica.com → /afiliado
 *   recepcionista.aloclinica.com → /recepcionista
 *   suporte.aloclinica.com → /suporte
 */
const SUBDOMAIN_ROUTES: Record<string, string> = {
  medico: "/medico",
  paciente: "/paciente",
  admin: "/admin",
  clinica: "/clinica",
  parceiro: "/parceiro",
  afiliado: "/afiliado",
  recepcionista: "/recepcionista",
  suporte: "/suporte",
  laudista: "/laudista",
};

function getSubdomain(): string | null {
  const hostname = window.location.hostname;

  // Skip for localhost / IP / preview URLs
  if (
    hostname === "localhost" ||
    hostname.match(/^\d+\.\d+\.\d+\.\d+$/) ||
    hostname.endsWith(".lovable.app")
  ) {
    return null;
  }

  const parts = hostname.split(".");
  // e.g. medico.aloclinica.com → ["medico", "aloclinica", "com"]
  if (parts.length >= 3) {
    const sub = parts[0];
    if (sub !== "www") return sub;
  }

  return null;
}

export function useSubdomainRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const subdomain = getSubdomain();
    if (!subdomain) return;

    const targetRoute = SUBDOMAIN_ROUTES[subdomain];
    if (!targetRoute) return;

    // Only redirect if on root path
    if (location.pathname === "/") {
      navigate(targetRoute, { replace: true });
    }
  }, [navigate, location.pathname]);
}
