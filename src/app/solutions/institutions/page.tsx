import { LeadCapture } from "@/components/forms/lead-capture";

export default function InstitutionsSolutionPage() {
  return (
    <div className="space-y-8">
      <section className="math-card bg-gradient-to-br from-cyan-50 to-white p-8 dark:from-slate-900 dark:to-slate-900">
        <p className="text-xs uppercase tracking-wide text-blue-600">学校/机构场景</p>
        <h1 className="mt-2 text-4xl font-semibold">把数学内容生产标准化，支持团队协作交付</h1>
        <p className="mt-3 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
          统一模板库、审批流、权限分级与席位管理，支持课程中心或教研团队长期运营。
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["组织协作", "多角色分工：教研、审核、发布"],
          ["知识资产", "模板与素材可复用、可版本化"],
          ["采购友好", "支持合同、发票、SLA 与专属支持"],
        ].map(([title, desc]) => (
          <article key={title} className="math-card p-5">
            <h2 className="text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{desc}</p>
          </article>
        ))}
      </section>

      <section className="math-card">
        <h2 className="text-2xl font-semibold">预约机构演示</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">提交后我们会按你的团队规模给出席位与迁移方案。</p>
        <div className="mt-4">
          <LeadCapture source="solution_institutions" segment="institution" buttonLabel="预约演示" />
        </div>
      </section>
    </div>
  );
}
