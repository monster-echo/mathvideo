import Link from "next/link";

import { LeadCapture } from "@/components/forms/lead-capture";

export default function CreatorsSolutionPage() {
  return (
    <div className="space-y-8">
      <section className="math-card bg-gradient-to-br from-indigo-50 to-white p-8 dark:from-slate-900 dark:to-slate-900">
        <p className="text-xs uppercase tracking-wide text-blue-600">创作者场景</p>
        <h1 className="mt-2 text-4xl font-semibold">稳定产出高质量数学视频，而不是临时拼凑</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          商用授权、品牌模板、批量导出，帮助你把创作流程变成可复用的生产线。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/creator" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            试试创作者工作流
          </Link>
          <Link href="/subscription" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">
            查看 Creator Pro
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["批量脚本", "同一主题快速生成多条短视频版本"],
          ["品牌一致", "统一配色、字幕、片头片尾模板"],
          ["商业安全", "可追溯授权，降低版权风险"],
        ].map(([title, desc]) => (
          <article key={title} className="math-card p-5">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{desc}</p>
          </article>
        ))}
      </section>

      <section className="math-card">
        <h2 className="text-2xl font-semibold">获取 Creator Pro 方案</h2>
        <div className="mt-4">
          <LeadCapture source="solution_creators" segment="creator" buttonLabel="领取创作者清单" />
        </div>
      </section>
    </div>
  );
}
