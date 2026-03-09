import { redirect } from "next/navigation";

import { DEFAULT_LOCALE } from "@/lib/i18n";

type CreatorPageProps = {
  searchParams: Promise<{ prompt?: string }>;
};

export default async function CreatorPage({ searchParams }: CreatorPageProps) {
  const { prompt } = await searchParams;

  const query = new URLSearchParams();
  if (prompt?.trim()) {
    query.set("prompt", prompt);
  }

  const suffix = query.toString();
  redirect(`/${DEFAULT_LOCALE}/creator${suffix ? `?${suffix}` : ""}`);
}
