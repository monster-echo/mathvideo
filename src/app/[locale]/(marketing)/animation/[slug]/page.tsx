import { notFound } from "next/navigation";

import { getAnimationDetailBySlug } from "@/lib/data/animations";
import { isLocale } from "@/lib/i18n";

import { AnimationDetailClient } from "./animation-detail-client";

type AnimationDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function AnimationDetailPage({ params }: AnimationDetailPageProps) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) notFound();

  const item = await getAnimationDetailBySlug(slug);
  if (!item) notFound();

  return <AnimationDetailClient locale={locale} item={item} />;
}
