import { notFound } from "next/navigation";

import { LegalPage } from "@/components/pages/legal-page";
import { isLocale } from "@/lib/i18n";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <LegalPage docKey="privacy" />;
}
