import Link from "next/link";
import { notFound } from "next/navigation";

import { homepageSteps } from "@/lib/data/animg";
import { isLocale, localePath } from "@/lib/i18n";

type HowItWorksPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function HowItWorksPage({ params }: HowItWorksPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  return (
    <div className="animg-container max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold">How AnimG Works</h1>
        <p className="text-lg animg-muted">
          Describe your animation in natural language. AnimG generates Manim code and renders it as video.
        </p>
      </header>

      <section className="animg-card p-6">
        <h2 className="text-2xl font-semibold">The Process</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {homepageSteps.map((step, index) => (
            <article key={step.title} className="rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Step {index + 1}</p>
              <h3 className="mt-1 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm animg-muted">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="animg-card p-6">
        <h2 className="text-2xl font-semibold">Playground</h2>
        <p className="mt-2 text-sm animg-muted">
          Skip the chat and write Manim code directly in Playground when you want low-level control.
        </p>
        <Link href={localePath(locale, "/playground")} className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
          Open playground →
        </Link>
      </section>

      <section className="animg-card p-6">
        <h2 className="text-2xl font-semibold">Get Started</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link href={localePath(locale, "/creator")} className="animg-button-primary">
            Start with creator
          </Link>
          <Link href={localePath(locale, "/playground")} className="animg-button-secondary">
            Try playground
          </Link>
        </div>
      </section>
    </div>
  );
}
