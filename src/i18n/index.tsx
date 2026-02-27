import { createContext, useContext, useMemo, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Language } from "../services/types";
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES, translations } from "./translations";

const LANGUAGE_STORAGE_KEY = "gymbuddy_lang";

type TranslationParams = Record<string, string | number>;
type TranslationFunction = (key: string, params?: TranslationParams) => string;

interface I18nContextValue {
  language: Language;
  setLanguage: (nextLanguage: string) => void;
  t: TranslationFunction;
}

function resolveLanguage(input: string | null | undefined): Language {
  if (!input) return DEFAULT_LANGUAGE as Language;
  const normalized = String(input).toLowerCase().slice(0, 2);
  return (SUPPORTED_LANGUAGES as string[]).includes(normalized) ? (normalized as Language) : (DEFAULT_LANGUAGE as Language);
}

function getMessage(dictionary: unknown, key: string): string | undefined {
  return key.split(".").reduce((acc: unknown, part: string) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>))
      return (acc as Record<string, unknown>)[part];
    return undefined;
  }, dictionary) as string | undefined;
}

function formatMessage(message: unknown, params?: TranslationParams): string {
  if (!params || typeof message !== "string") return String(message ?? "");
  return message.replace(/\{(\w+)\}/g, (_, token: string) => String(params[token] ?? `{${token}}`));
}

function translate(language: Language, key: string, params?: TranslationParams): string {
  const dict = translations as Record<string, unknown>;
  const dictionary = dict[language] ?? dict[DEFAULT_LANGUAGE];
  const fallbackDictionary = dict[DEFAULT_LANGUAGE];
  const message = getMessage(dictionary, key) ?? getMessage(fallbackDictionary, key) ?? key;
  return formatMessage(message, params);
}

const I18nContext = createContext<I18nContextValue>({
  language: DEFAULT_LANGUAGE as Language,
  setLanguage: () => {},
  t: (key: string, params?: TranslationParams) => translate(DEFAULT_LANGUAGE as Language, key, params),
});

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE as Language;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored) return resolveLanguage(stored);
  return resolveLanguage(window.navigator.language);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const setLanguage = useCallback((nextLanguage: string) => {
    setLanguageState(resolveLanguage(nextLanguage));
  }, []);

  const t: TranslationFunction = useCallback((key: string, params?: TranslationParams) => {
    return translate(language, key, params);
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
