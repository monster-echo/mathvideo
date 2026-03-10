import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getFeaturedAnimations } from "@/lib/data/animations";
import { isLocale, localePath } from "@/lib/i18n";

type ExplorePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ExplorePage({ params }: ExplorePageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();
  const items = await getFeaturedAnimations();

  return (
    <div className="animg-container">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Explore Animations</h1>
        <p className="mt-2 text-lg animg-muted">
          Discover amazing manim animations created by the AnimG community.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="animg-card overflow-hidden">
            <Link href={localePath(locale, `/animation/${item.slug}`)}>
              <div className="group relative aspect-video overflow-hidden bg-slate-900">
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
                <span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs font-medium text-white">
                  {item.duration}
                </span>
                <div className="absolute inset-0 hidden items-center justify-center bg-black/45 text-sm font-semibold text-white group-hover:flex">
                  View Details
                </div>
              </div>
            </Link>

            <div className="flex h-full flex-col p-4">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="mt-2 text-sm animg-muted">{item.summary}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span key={`${item.id}-${tag}`} className="animg-tag">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {item.createdAt}
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="fixed bottom-6 right-6 z-30 hidden max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-lg lg:block dark:border-slate-700 dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          Create with AnimG AI
        </p>
        <p className="mt-1 text-sm animg-muted">
          Describe your animation idea and let AnimG AI generate the Manim code.
        </p>
        <Link
          href={localePath(locale, "/creator")}
          className="animg-button-primary mt-3 w-full"
        >
          Open Creator
        </Link>
      </aside>
    </div>
  );
}
