import { notFound } from "next/navigation";

import { UseCasePage } from "@/components/pages/use-case-page";
import { isLocale } from "@/lib/i18n";

export default async function StudentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return <UseCasePage locale={locale} pageKey="manim-for-students" />;
}
