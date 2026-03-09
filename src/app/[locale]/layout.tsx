import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getLocalePageTitle } from "@/lib/data/animg";
import { isLocale, SUPPORTED_LOCALES } from "@/lib/i18n";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return SUPPORTED_LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const normalized = isLocale(locale) ? locale : "en";

  return {
    title: getLocalePageTitle(normalized),
    description: "Create Manim animations in browser with AI",
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return children;
}
