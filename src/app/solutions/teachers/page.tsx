import Link from "next/link";

import { LeadCapture } from "@/components/forms/lead-capture";

export default function TeachersSolutionPage() {
  return (
    <div className="space-y-8">
      <section className="math-card bg-gradient-to-br from-blue-50 to-white p-8 dark:from-slate-900 dark:to-slate-900">
        <p className="text-xs uppercase tracking-wide text-blue-600">教师场景</p>
        <h1 className="mt-2 text-4xl font-semibold">把抽象数学讲成“看得见”的课堂体验</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          从章节目标到课堂成片：动画、讲解词、板书节奏和习题引导一站生成。
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/creator" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            立即做一节课
          </Link>
          <Link href="/subscription" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">
            查看教师方案
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["课前", "输入知识点，自动生成 12 分钟可讲解动画脚本"],
          ["课中", "关键推导步骤放慢，配合提示词讲解"],
          ["课后", "一键导出复习视频与作业变体"],
        ].map(([title, desc]) => (
          <article key={title} className="math-card p-5">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{desc}</p>
          </article>
        ))}
      </section>

      <section className="math-card">
        <h2 className="text-2xl font-semibold">获取教师版试用与迁移模板</h2>
        <div className="mt-4">
          <LeadCapture source="solution_teachers" segment="teacher" buttonLabel="申请教师试用" />
        </div>
      </section>
    </div>
  );
}
