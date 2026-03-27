import { logError } from "@/lib/logger";

/**
 * Detectar e registrar comportamentos suspeitos no frontend
 */
export const securityMonitor = {
  trackFailedLogin: (email: string) => {
    const key = `failed_login_${email}`;
    const attempts = parseInt(localStorage.getItem(key) ?? "0") + 1;
    localStorage.setItem(key, String(attempts));

    if (attempts >= 5) {
      logError("Múltiplas tentativas de login falhas", null, {
        email: email.slice(0, 3) + "***",
        attempts,
      });
      localStorage.setItem(
        `${key}_blocked_until`,
        String(Date.now() + 15 * 60 * 1000)
      );
    }
  },

  isLoginBlocked: (email: string): boolean => {
    const blockedUntil = localStorage.getItem(`failed_login_${email}_blocked_until`);
    if (!blockedUntil) return false;
    if (Date.now() > parseInt(blockedUntil)) {
      localStorage.removeItem(`failed_login_${email}_blocked_until`);
      localStorage.removeItem(`failed_login_${email}`);
      return false;
    }
    return true;
  },

  clearFailedLogins: (email: string) => {
    localStorage.removeItem(`failed_login_${email}`);
    localStorage.removeItem(`failed_login_${email}_blocked_until`);
  },
};
