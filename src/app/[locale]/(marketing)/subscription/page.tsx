import { notFound } from "next/navigation";

import { isLocale } from "@/lib/i18n";

import { SubscriptionClient } from "./subscription-client";

type SubscriptionPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function SubscriptionPage({ params }: SubscriptionPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  return <SubscriptionClient locale={locale} />;
}
