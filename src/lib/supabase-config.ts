const FALLBACK_SUPABASE_URL = "https://oaixgmuocuwhsabidpei.supabase.co";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc";

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || FALLBACK_SUPABASE_PUBLISHABLE_KEY;
export const SUPABASE_PROJECT_ID =
  import.meta.env.VITE_SUPABASE_PROJECT_ID?.trim() || new URL(SUPABASE_URL).hostname.split(".")[0];
export const SUPABASE_FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
export const hasExplicitSupabaseEnv = Boolean(
  import.meta.env.VITE_SUPABASE_URL?.trim() && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim(),
);

if (import.meta.env.DEV && !import.meta.env.VITE_SUPABASE_URL) {
  console.warn('[AloClínica] Usando credenciais Supabase de fallback. Configure VITE_SUPABASE_URL em produção.');
}
