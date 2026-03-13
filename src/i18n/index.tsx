import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import ptBR, { type TranslationKeys } from "./locales/pt-BR";
import en from "./locales/en";
import es from "./locales/es";

export type Locale = "pt-BR" | "en" | "es";

const translations: Record<Locale, Record<TranslationKeys, string>> = {
  "pt-BR": ptBR,
  en,
  es,
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
    if (stored && translations[stored]) return stored;

    const browserLang = navigator.language;
    if (browserLang.startsWith("es")) return "es";
    if (browserLang.startsWith("en")) return "en";
  } catch (error) {
    console.warn("[i18n] Falha ao recuperar locale inicial:", error);
  }

  return "pt-BR";
};

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);

    try {
      window.localStorage.setItem("locale", l);
    } catch (error) {
      console.warn("[i18n] Falha ao persistir locale:", error);
    }

    if (typeof document !== "undefined") {
      document.documentElement.lang = l === "pt-BR" ? "pt-BR" : l;
    }
  }, []);

  const t = useCallback(
    (key: TranslationKeys): string => translations[locale][key] ?? translations["pt-BR"][key] ?? key,
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => useContext(I18nContext);
