import { notFound } from "next/navigation";

import { isLocale } from "@/lib/i18n";

import { CreatorWorkbench } from "./creator-workbench";

type CreatorPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ prompt?: string }>;
};

export default async function CreatorPage({ params, searchParams }: CreatorPageProps) {
  const { locale } = await params;
  const { prompt } = await searchParams;

  if (!isLocale(locale)) notFound();

  return <CreatorWorkbench locale={locale} initialPrompt={prompt ?? ""} />;
}
