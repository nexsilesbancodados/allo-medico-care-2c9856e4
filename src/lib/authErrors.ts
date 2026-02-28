// Centralized translation map for Supabase auth errors
const AUTH_ERRORS: Record<string, string> = {
  "Invalid login credentials": "Email ou senha incorretos.",
  "Email not confirmed": "Confirme seu email antes de entrar.",
  "User already registered": "Este email já possui uma conta.",
  "Password should be at least 6 characters": "A senha precisa ter pelo menos 6 caracteres.",
  "Signup requires a valid password": "A senha precisa ter pelo menos 6 caracteres.",
  "Unable to validate email address: invalid format": "Formato de email inválido.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  "For security purposes, you can only request this after": "Aguarde alguns segundos antes de tentar novamente.",
  "User not found": "Nenhuma conta encontrada com esse email.",
  "New password should be different from the old password": "A nova senha deve ser diferente da anterior.",
  "Auth session missing!": "Sessão expirada. Faça login novamente.",
};

export function translateAuthError(message: string): string {
  // Exact match first
  if (AUTH_ERRORS[message]) return AUTH_ERRORS[message];
  // Partial match
  for (const [key, value] of Object.entries(AUTH_ERRORS)) {
    if (message.includes(key)) return value;
  }
  return message;
}
