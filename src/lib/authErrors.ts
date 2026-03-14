/** Centralized translation map for Supabase auth errors → Portuguese */
const AUTH_ERRORS: Record<string, string> = {
  // Login
  "Invalid login credentials":           "Email ou senha incorretos.",
  "invalid_credentials":                  "Email ou senha incorretos.",
  "Email not confirmed":                  "Confirme seu email antes de entrar.",
  "email_not_confirmed":                  "Confirme seu email antes de entrar.",
  // Registration
  "User already registered":             "Este email já possui uma conta.",
  "user_already_exists":                 "Este email já possui uma conta.",
  "Password should be at least 6 characters": "A senha precisa ter pelo menos 6 caracteres.",
  "Signup requires a valid password":    "A senha precisa ter pelo menos 6 caracteres.",
  "password_too_short":                  "A senha precisa ter pelo menos 6 caracteres.",
  "Unable to validate email address: invalid format": "Formato de email inválido.",
  "invalid_email":                       "Formato de email inválido.",
  // Rate limits
  "Email rate limit exceeded":           "Muitas tentativas de email. Aguarde alguns minutos.",
  "over_email_send_rate_limit":          "Muitas tentativas de email. Aguarde alguns minutos.",
  "For security purposes, you can only request this after": "Aguarde alguns segundos antes de tentar novamente.",
  "over_request_rate_limit":             "Muitas requisições. Aguarde e tente novamente.",
  "too_many_requests":                   "Muitas tentativas. Aguarde alguns minutos.",
  // Session
  "User not found":                      "Nenhuma conta encontrada com esse email.",
  "user_not_found":                      "Nenhuma conta encontrada com esse email.",
  "Auth session missing!":               "Sessão expirada. Faça login novamente.",
  "session_not_found":                   "Sessão expirada. Faça login novamente.",
  // Password
  "New password should be different from the old password": "A nova senha deve ser diferente da anterior.",
  "same_password":                       "A nova senha deve ser diferente da anterior.",
  "weak_password":                       "A senha é muito fraca. Use letras, números e símbolos.",
  // OAuth
  "oauth_provider_not_supported":        "Provedor de login não suportado.",
  // Generic
  "unexpected_failure":                  "Ocorreu um erro inesperado. Tente novamente.",
};

/**
 * Translates a Supabase auth error message to Portuguese.
 * Tries exact match first, then partial match, then returns the original.
 */
export function translateAuthError(message: string): string {
  if (!message) return "Ocorreu um erro. Tente novamente.";

  // Exact match
  if (AUTH_ERRORS[message]) return AUTH_ERRORS[message];

  // Partial / substring match
  for (const [key, value] of Object.entries(AUTH_ERRORS)) {
    if (message.toLowerCase().includes(key.toLowerCase())) return value;
  }

  // Unknown — return raw message (could be from network, not Supabase)
  return message;
}
