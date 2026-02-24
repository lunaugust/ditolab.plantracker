import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations } from "./translations";

const LANGUAGE_STORAGE_KEY = "gymbuddy_lang";

function resolveLanguage(input) {
  if (!input) return DEFAULT_LANGUAGE;
  const normalized = String(input).toLowerCase().slice(0, 2);
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : DEFAULT_LANGUAGE;
}

function getMessage(dictionary, key) {
  return key.split(".").reduce((acc, part) => {
    if (acc && typeof acc === "object" && part in acc) return acc[part];
    return undefined;
  }, dictionary);
}

function formatMessage(message, params) {
  if (!params || typeof message !== "string") return message;
  return message.replace(/\{(\w+)\}/g, (_, token) => String(params[token] ?? `{${token}}`));
}

function translate(language, key, params) {
  const dictionary = translations[language] || translations[DEFAULT_LANGUAGE];
  const fallbackDictionary = translations[DEFAULT_LANGUAGE];

  const message = getMessage(dictionary, key) ?? getMessage(fallbackDictionary, key) ?? key;
  return formatMessage(message, params);
}

const I18nContext = createContext({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => {},
  t: (key, params) => translate(DEFAULT_LANGUAGE, key, params),
});

function getInitialLanguage() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored) return resolveLanguage(stored);
  return resolveLanguage(window.navigator.language);
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    setLanguageState(resolveLanguage(nextLanguage));
  }, []);

  const t = useCallback((key, params) => {
    return translate(language, key, params);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
