import Link from "next/link";

import { useCasePages } from "@/lib/data/animg";
import { localePath, type Locale } from "@/lib/i18n";

type UseCaseKey = "manim-for-educators" | "manim-for-students" | "manim-for-youtube";

type UseCasePageProps = {
  locale: Locale;
  pageKey: UseCaseKey;
};

export function UseCasePage({ locale, pageKey }: UseCasePageProps) {
  const content = useCasePages[pageKey];

  return (
    <div className="animg-container space-y-8">
      <section className="animg-card p-7 sm:p-9">
        <p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
          {content.badge}
        </p>
        <h1 className="mt-3 text-4xl font-bold">{content.title}</h1>
        <p className="mt-3 max-w-4xl text-lg animg-muted">{content.subtitle}</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={localePath(locale, "/creator")} className="animg-button-primary">
            {content.ctaPrimary}
          </Link>
          <Link href={localePath(locale, "/examples")} className="animg-button-secondary">
            {content.ctaSecondary}
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold">{content.whyTitle}</h2>
        <p className="mt-2 animg-muted">{content.whySubtitle}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {content.whyItems.map((item) => (
            <article key={item.title} className="animg-card p-5">
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm animg-muted">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-3xl font-bold">{content.topicsTitle}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {content.topics.map((topic) => (
            <article key={topic.title} className="animg-card p-5">
              <h3 className="text-lg font-semibold">{topic.title}</h3>
              <p className="mt-2 text-sm animg-muted">{topic.description}</p>
            </article>
          ))}
        </div>
      </section>

      {content.faqs?.length ? (
        <section>
          <h2 className="text-3xl font-bold">{content.faqTitle}</h2>
          <div className="mt-4 grid gap-3">
            {content.faqs.map((item) => (
              <details key={item.question} className="animg-card p-4">
                <summary className="cursor-pointer text-base font-semibold">{item.question}</summary>
                <p className="mt-2 text-sm animg-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="animg-card p-6">
        <h2 className="text-3xl font-bold">{content.proTitle}</h2>
        <p className="mt-2 animg-muted">{content.proSubtitle}</p>

        <ul className="mt-4 space-y-2 text-sm animg-muted">
          {content.proItems.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>

        <div className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-sm dark:bg-slate-900">
          <p className="text-xl font-bold">{content.proPriceLine}</p>
          <p className="animg-muted">{content.proPriceHint}</p>
        </div>

        <Link href={localePath(locale, "/subscription")} className="animg-button-primary mt-4">
          Start Pro Today
        </Link>
        <p className="mt-3 text-sm animg-muted">{content.socialProof}</p>
      </section>

      <section className="animg-card p-6">
        <h2 className="text-3xl font-bold">{content.finalTitle}</h2>
        <p className="mt-2 animg-muted">{content.finalSubtitle}</p>
        <Link href={localePath(locale, "/creator")} className="animg-button-primary mt-4">
          Create Your First Animation
        </Link>
      </section>
    </div>
  );
}
