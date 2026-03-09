import Link from "next/link";

import { getFeaturedAnimations } from "@/lib/data/animations";

export default async function ExplorePage() {
  const animations = await getFeaturedAnimations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">探索动画</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">发现社区创作的数学动画，并一键复用提示词。</p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {animations.map((item) => (
          <article key={item.id} className="math-card p-0">
            <div className="h-36 rounded-t-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-500" />
            <div className="p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{item.title}</h2>
                <span className="text-xs text-slate-500">{item.duration}</span>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={`${item.id}-${tag}`}
                    className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <Link href="/creator" className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
                基于此模板创作 →
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
