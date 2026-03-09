import { notFound } from "next/navigation";

import { isLocale } from "@/lib/i18n";

import { MyAnimationsClient } from "./my-animations-client";

export default async function MyAnimationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <MyAnimationsClient locale={locale} />;
}
