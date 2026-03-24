import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import ptBR, { type TranslationKeys } from "./locales/pt-BR";
import { warn } from "@/lib/logger";

export type Locale = "pt-BR" | "en" | "es";

// Lazy-load non-default locales to reduce initial JS payload
const localeLoaders: Record<Locale, () => Promise<Record<TranslationKeys, string>>> = {
  "pt-BR": () => Promise.resolve(ptBR),
  en: () => import("./locales/en").then((m) => m.default),
  es: () => import("./locales/es").then((m) => m.default),
};

// Cache loaded locales
const loadedLocales: Partial<Record<Locale, Record<TranslationKeys, string>>> = {
  "pt-BR": ptBR,
};

export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português",
  en: "English",
  es: "Español",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  "pt-BR": "🇧🇷",
  en: "🇺🇸",
  es: "🇪🇸",
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKeys) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "pt-BR",
  setLocale: () => {},
  t: (key) => key,
});

const getInitialLocale = (): Locale => {
  try {
    const stored = window.localStorage.getItem("locale") as Locale | null;
    if (stored && localeLoaders[stored]) return stored;

    const browserLang = navigator.language;
    if (browserLang.startsWith("es")) return "es";
    if (browserLang.startsWith("en")) return "en";
  } catch (error) {
    warn("[i18n] Falha ao recuperar locale inicial:", error);
  }

  return "pt-BR";
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const [translations, setTranslations] = useState<Record<TranslationKeys, string>>(
    () => loadedLocales[getInitialLocale()] ?? ptBR
  );

  const setLocale = useCallback((l: Locale) => {
    const cached = loadedLocales[l];
    if (cached) {
      setLocaleState(l);
      setTranslations(cached);
    } else {
      localeLoaders[l]()
        .then((dict) => {
          loadedLocales[l] = dict;
          setLocaleState(l);
          setTranslations(dict);
        })
        .catch(() => {
          warn("[i18n] Failed to load locale:", l);
        });
    }

    try {
      window.localStorage.setItem("locale", l);
    } catch (error) {
      warn("[i18n] Falha ao persistir locale:", error);
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = l === "pt-BR" ? "pt-BR" : l;
    }
  }, []);

  // On mount, load non-default locale if needed
  useState(() => {
    const initial = getInitialLocale();
    if (initial !== "pt-BR" && !loadedLocales[initial]) {
      localeLoaders[initial]()
        .then((dict) => {
          loadedLocales[initial] = dict;
          setTranslations(dict);
        })
        .catch(() => {});
    }
  });

  const t = useCallback(
    (key: TranslationKeys): string => translations[key] ?? ptBR[key] ?? key,
    [translations]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
