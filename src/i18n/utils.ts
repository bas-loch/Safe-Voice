import fr from "./fr.json";
import it from "./it.json";
import en from "./en.json";

export const languages = {
  fr: "Français",
  it: "Italiano",
  en: "English",
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = "fr";

const dictionaries = { fr, it, en } as const;

export type Dictionary = typeof fr;

export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split("/");
  if (first === "it" || first === "en") return first;
  return defaultLang;
}

export function useTranslations(lang: Lang): Dictionary {
  return dictionaries[lang];
}

/**
 * Construit un chemin localisé. Le français (langue par défaut) n'a pas de préfixe.
 * ex: getLocalizedPath("it", "/carte") -> "/it/carte"
 */
export function getLocalizedPath(lang: Lang, path: string): string {
  const cleanPath = path === "/" ? "" : path;
  if (lang === defaultLang) return cleanPath || "/";
  return `/${lang}${cleanPath}`;
}

export function getAlternateLinks(path: string): { lang: Lang | "x-default"; href: string }[] {
  const base = path.replace(/^\/(it|en)/, "") || "/";
  return [
    { lang: "fr", href: getLocalizedPath("fr", base) },
    { lang: "it", href: getLocalizedPath("it", base) },
    { lang: "en", href: getLocalizedPath("en", base) },
    { lang: "x-default", href: getLocalizedPath("fr", base) },
  ];
}
