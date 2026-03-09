const supportItems = [
  {
    title: "产品文档",
    desc: "从 Prompt 写法到渲染优化，覆盖完整教学与创作流程。",
  },
  {
    title: "动画示例",
    desc: "可直接复用的高数、线代、竞赛与科普模板。",
  },
  {
    title: "社区与反馈",
    desc: "加入 Discord，提交需求并获得工程师支持。",
  },
];

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-semibold">帮助与支持</h1>
      <p className="text-sm text-slate-600 dark:text-slate-300">快速找到文档、示例、反馈入口与社区资源。</p>

      <div className="grid gap-4 md:grid-cols-3">
        {supportItems.map((item) => (
          <article key={item.title} className="math-card p-5">
            <h2 className="text-xl font-semibold">{item.title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{item.desc}</p>
          </article>
        ))}
      </div>

      <section className="math-card flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">邮件反馈</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">animg@voycrew.com</p>
        </div>
        <div>
          <p className="font-semibold">Discord 社区</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">discord.gg/sqrCJUZHkK</p>
        </div>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">联系支持</button>
      </section>
    </div>
  );
}
