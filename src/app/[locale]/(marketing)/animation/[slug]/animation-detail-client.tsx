"use client";

import { useState } from "react";

import type { AnimationItem } from "@/lib/data/animg";
import { localePath, type Locale } from "@/lib/i18n";

type AnimationDetailClientProps = {
  item: AnimationItem;
  locale: Locale;
};

export function AnimationDetailClient({ item, locale }: AnimationDetailClientProps) {
  const [tab, setTab] = useState<"spec" | "code">("spec");

  return (
    <div className="animg-container space-y-5">
      <h1 className="text-4xl font-bold">{item.title}</h1>

      <div className="grid gap-5 lg:grid-cols-[1fr,360px]">
        <section className="space-y-4">
          <div className="animg-card overflow-hidden">
            <div className="aspect-video bg-black">
              <video src={item.videoUrl} poster={item.thumbnailUrl} controls className="h-full w-full" preload="metadata" />
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm animg-muted">Duration: {item.duration}</p>
              <a
                href={item.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="animg-button-secondary px-3 py-1.5 text-xs"
              >
                Download video
              </a>
            </div>
          </div>

          <div className="animg-card overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setTab("spec")}
                className={`px-4 py-2 text-sm font-semibold ${tab === "spec" ? "text-blue-600" : "text-slate-600 dark:text-slate-300"}`}
              >
                Specification
              </button>
              <button
                type="button"
                onClick={() => setTab("code")}
                className={`px-4 py-2 text-sm font-semibold ${tab === "code" ? "text-blue-600" : "text-slate-600 dark:text-slate-300"}`}
              >
                Code
              </button>
            </div>
            <div className="max-h-[560px] overflow-auto p-4">
              {tab === "spec" ? (
                <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">{item.specMarkdown}</pre>
              ) : (
                <pre className="overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-relaxed text-slate-200">{item.code}</pre>
              )}
            </div>
          </div>
        </section>

        <aside className="animg-card h-fit p-5">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Created By</h2>
            <p className="mt-2 text-lg font-semibold">{item.author}</p>
          </section>

          <section className="mt-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Description</h2>
            <p className="mt-2 text-sm animg-muted">{item.description}</p>
          </section>

          <section className="mt-5 grid gap-4 text-sm">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Created At</p>
              <p className="animg-muted">{item.createdAt}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Duration</p>
              <p className="animg-muted">{item.duration}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Tags</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span key={`${item.id}-${tag}`} className="animg-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Status</p>
              <p className="text-emerald-600 dark:text-emerald-300">{item.status}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">AI Model</p>
              <p className="animg-muted">{item.aiModel}</p>
            </div>
          </section>

          <button type="button" className="animg-button-primary mt-6 w-full">
            Fork animation
          </button>
          <a href={localePath(locale, "/creator")} className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700">
            Create with AnimG AI →
          </a>
        </aside>
      </div>
    </div>
  );
}
