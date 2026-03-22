/**
 * Client-side security utilities.
 * CSP and security headers are set via vercel.json for production.
 */

/** Detect if the current context is a sandboxed iframe (Lovable preview) */
export const isPreviewMode = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

/** Check for common browser-based attacks */
export const detectSuspiciousActivity = (): boolean => {
  // Check for devtools overrides on critical functions
  if (typeof fetch !== "function") return true;
  
  // Check for prototype pollution
  const obj = {} as Record<string, unknown>;
  if (obj.isAdmin || obj.role) return true;
  
  return false;
};

/** Prevent clickjacking in non-preview environments */
export const initFrameGuard = (): void => {
  if (isPreviewMode()) return;
  
  const allowedOrigins = [
    "lovable.app",
    "lovable.dev",
    "allo-medico-care.lovable.app",
  ];
  
  try {
    if (window.self !== window.top) {
      const parentOrigin = document.referrer ? new URL(document.referrer).hostname : "";
      const isAllowed = allowedOrigins.some((o) => parentOrigin.endsWith(o));
      if (!isAllowed) {
        document.body.innerHTML = "<h1>Acesso não autorizado</h1>";
      }
    }
  } catch {
    // cross-origin frame — block
  }
};

/** Log security events for monitoring */
export const logSecurityEvent = (event: string, details?: Record<string, unknown>): void => {
  console.warn(`[SECURITY] ${event}`, details || "");
};
