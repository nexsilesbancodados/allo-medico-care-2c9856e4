import { toast } from "sonner";
import { warn } from "@/lib/logger";

interface SupabaseError {
  message?: string;
  status?: number;
  code?: string;
}

/**
 * Wraps a Supabase query with automatic retry on rate-limit (429) or network errors.
 * Shows a toast on final failure.
 */
export async function withRetry<T>(
  fn: () => Promise<{ data: T | null; error: SupabaseError | null }>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<{ data: T | null; error: SupabaseError | null }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await fn();

    if (!result.error) return result;

    const status = result.error?.status ?? result.error?.code;
    const isRetryable = status === 429 || status === 500 || status === 503 || status === "PGRST301";

    if (!isRetryable || attempt === maxRetries) {
      showErrorToast(result.error);
      return result;
    }

    // Exponential backoff with jitter
    const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
    await new Promise(r => setTimeout(r, delay));
  }

  // Should never reach here, but just in case
  return { data: null, error: { message: "Max retries exceeded" } };
}

function showErrorToast(error: SupabaseError | null) {
  const message = error?.message || "Ocorreu um erro inesperado.";
  const isRateLimit = error?.status === 429;
  const isNetwork = !navigator.onLine || message.includes("fetch");

  const title = isRateLimit
    ? "Muitas requisições"
    : isNetwork
      ? "Sem conexão"
      : "Erro";

  const description = isRateLimit
    ? "Aguarde alguns segundos e tente novamente."
    : isNetwork
      ? "Verifique sua conexão com a internet."
      : message;

  toast.error(title, { description });
}

/**
 * Global network error listener — shows toast when connection is lost/restored.
 */
export function initNetworkListeners() {
  window.addEventListener("offline", () => {
    toast.error("Conexão perdida", {
      description: "Você está offline. Algumas funcionalidades podem não funcionar.",
    });
  });

  window.addEventListener("online", () => {
    toast.success("Conexão restaurada ✅", {
      description: "Você está online novamente.",
    });
  });
}
