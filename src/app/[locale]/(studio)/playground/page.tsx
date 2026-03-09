import { notFound } from "next/navigation";

import { isLocale } from "@/lib/i18n";

import { PlaygroundClient } from "./playground-client";

type PlaygroundPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function PlaygroundPage({ params }: PlaygroundPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  return <PlaygroundClient locale={locale} />;
}
