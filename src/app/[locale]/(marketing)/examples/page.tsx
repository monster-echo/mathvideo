import Link from "next/link";
import { notFound } from "next/navigation";

import { exampleCategories } from "@/lib/data/animg";
import { isLocale, localePath } from "@/lib/i18n";

type ExamplesPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ExamplesPage({ params }: ExamplesPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  return (
    <div className="animg-container space-y-8">
      <header className="space-y-3">
        <h1 className="text-4xl font-bold">Manim Animation Examples & Ideas</h1>
        <p className="max-w-3xl text-lg animg-muted">
          Get inspired by these mathematical animation ideas. Click any example to try it instantly with AnimG.
        </p>
        <Link href={localePath(locale, "/creator")} className="animg-button-primary">
          Start Creating
        </Link>
      </header>

      {exampleCategories.map((category) => (
        <section key={category.name} className="space-y-3">
          <h2 className="text-2xl font-bold">{category.name}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {category.items.map((item) => (
              <article key={item.title} className="animg-card p-5">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm animg-muted">{item.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={`${item.title}-${tag}`} className="animg-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link
                  href={`${localePath(locale, "/creator")}?prompt=${encodeURIComponent(item.prompt)}`}
                  className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  Try this example →
                </Link>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="animg-card p-6">
        <h2 className="text-2xl font-semibold">Have Your Own Idea?</h2>
        <p className="mt-2 text-sm animg-muted">
          Describe your idea and let AnimG generate the scene specification and code path for you.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={localePath(locale, "/creator")} className="animg-button-primary">
            Create Your Animation
          </Link>
          <Link href={localePath(locale, "/explore")} className="animg-button-secondary">
            Browse Community Animations
          </Link>
        </div>
      </section>
    </div>
  );
}
