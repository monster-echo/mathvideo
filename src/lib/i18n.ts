export const SUPPORTED_LOCALES = ["en", "zh", "de"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_COOKIE_NAME = "animg-locale";

export function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

export function normalizeLocale(value: string): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export function localePath(locale: Locale, href: string): string {
  if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:") || href.startsWith("#")) {
    return href;
  }

  if (href === "/") return `/${locale}`;

  const normalized = href.startsWith("/") ? href : `/${href}`;
  return `/${locale}${normalized}`;
}

export function swapLocaleInPath(pathname: string, nextLocale: Locale): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return `/${nextLocale}`;

  if (isLocale(segments[0])) {
    segments[0] = nextLocale;
  } else {
    segments.unshift(nextLocale);
  }

  return `/${segments.join("/")}`;
}
