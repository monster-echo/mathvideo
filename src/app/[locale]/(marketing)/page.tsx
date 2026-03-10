import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { HomeHeroPrompt } from "@/components/pages/home-hero-prompt";
import { communityAnimations } from "@/lib/data/animg";
import { isLocale, localePath, type Locale } from "@/lib/i18n";

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

type HomeCopy = {
  hero: {
    badge: string;
    titleTop: string;
    titleBottom: string;
    hint: string;
    placeholder: string;
    cta: string;
    metrics: Array<{ title: string; subtitle: string; tone: string }>;
  };
  tools: {
    badge: string;
    title: string;
    cards: Array<{
      title: string;
      desc: string;
      cta: string;
      href: string;
      tone: "blue" | "pink" | "violet";
    }>;
  };
  useCases: {
    badge: string;
    title: string;
    subtitle: string;
    cards: Array<{
      title: string;
      desc: string;
      cta: string;
      href: string;
      tone: "emerald" | "amber" | "cyan";
    }>;
  };
  howToUse: {
    badge: string;
    title: string;
    subtitle: string;
    steps: Array<{ title: string; desc: string }>;
    cta: string;
  };
  faq: {
    badge: string;
    title: string;
    subtitle: string;
    items: Array<{ q: string; a: string }>;
  };
  community: {
    badge: string;
    title: string;
    subtitle: string;
    cta: string;
  };
};

const zhCopy: HomeCopy = {
  hero: {
    badge: "AI 驱动 · 免安装 · 免费试用",
    titleTop: "AnimG – Manim AI 数学动画",
    titleBottom: "在线做数学动画",
    hint: "输入描述，按回车即可开始",
    placeholder: "描述你想做的动画… 如：「用渐变色做一个旋转的 3D 立方体」",
    cta: "从零开始",
    metrics: [
      { title: "AI 驱动", subtitle: "说一句话就出视频", tone: "text-blue-600" },
      {
        title: "免安装",
        subtitle: "打开浏览器就能用",
        tone: "text-indigo-600",
      },
      { title: "即时", subtitle: "实时渲染", tone: "text-violet-600" },
    ],
  },
  tools: {
    badge: "功能一览",
    title: "从想法到成片，一站搞定",
    cards: [
      {
        title: "Manim AI 创作",
        desc: "用文字描述想法，AnimG 的 AI 帮你生成精确的数学动画，省时省力。",
        cta: "用 AI 创作",
        href: "/creator",
        tone: "blue",
      },
      {
        title: "发布与发现",
        desc: "把你的动画发布出去，也能浏览社区里别人做的数学动画，互相启发。",
        cta: "逛逛社区",
        href: "/explore",
        tone: "pink",
      },
      {
        title: "在线 Manim 演练场",
        desc: "不用装环境，在浏览器里直接写 Manim 代码、编译、出视频。",
        cta: "去演练场试试",
        href: "/playground",
        tone: "violet",
      },
    ],
  },
  useCases: {
    badge: "多种场景都适用",
    title: "教学、学习、创作，一套工具全覆盖",
    subtitle:
      "无论你是老师、学生还是内容创作者，都可以用 AnimG 高效制作数学动画。",
    cards: [
      {
        title: "教师课堂讲解",
        desc: "把抽象公式和定理变成可视化讲解片段，帮助学生更快理解难点。",
        cta: "查看教师场景",
        href: "/manim-for-educators",
        tone: "emerald",
      },
      {
        title: "学生复习自学",
        desc: "通过动画推导与步骤演示，快速复盘线代、微积分和概率统计重点。",
        cta: "查看学生场景",
        href: "/manim-for-students",
        tone: "amber",
      },
      {
        title: "内容创作发布",
        desc: "为课程、YouTube 和社媒制作更有记忆点的数学可视化内容。",
        cta: "查看创作者场景",
        href: "/manim-for-youtube",
        tone: "cyan",
      },
    ],
  },
  howToUse: {
    badge: "AnimG 怎么用？",
    title: "3 步完成数学动画",
    subtitle: "从想法到成片，流程足够简单：先描述，再确认，再渲染。",
    steps: [
      {
        title: "1. 输入你的想法",
        desc: "在首页或创作页输入自然语言，比如“演示梯度下降收敛过程”。",
      },
      {
        title: "2. 生成并确认草案",
        desc: "AI 会生成动画结构与时间线，你可以继续追加要求微调结果。",
      },
      {
        title: "3. 渲染并导出视频",
        desc: "确认后提交渲染，完成后可在社区发布或下载用于课程和内容创作。",
      },
    ],
    cta: "查看完整工作流程",
  },
  faq: {
    badge: "常见问题",
    title: "你可能会关心这些问题",
    subtitle: "关于使用门槛、渲染方式和导出能力的高频疑问",
    items: [
      {
        q: "需要安装 Manim 或 Python 环境吗？",
        a: "不需要。AnimG 支持浏览器在线创作与渲染，无需本地配置开发环境。",
      },
      {
        q: "不会写代码也能做数学动画吗？",
        a: "可以。你可以直接用自然语言描述动画目标，系统会生成可渲染草案。",
      },
      {
        q: "可以导出视频用于课程或内容发布吗？",
        a: "可以。渲染完成后支持导出视频，并可用于教学、课程和内容创作场景。",
      },
      {
        q: "如果我想精细控制动画细节怎么办？",
        a: "你可以在创作页继续追加要求，也可以进入 Playground 直接调整 Manim 代码。",
      },
    ],
  },
  community: {
    badge: "社区作品",
    title: "大家最近在做什么",
    subtitle: "看看 AnimG 社区里最近产出的数学动画",
    cta: "看全部动画",
  },
};

const enCopy: HomeCopy = {
  hero: {
    badge: "AI-powered · No install · Free to try",
    titleTop: "AnimG - Manim AI Video Generator",
    titleBottom: "Create Mathematical Animations Online",
    hint: "Describe your idea, press Enter to start",
    placeholder: "Describe your animation idea...",
    cta: "Start from scratch",
    metrics: [
      { title: "AI-Powered", subtitle: "Text to video", tone: "text-blue-600" },
      {
        title: "No Install",
        subtitle: "Browser only",
        tone: "text-indigo-600",
      },
      {
        title: "Instant",
        subtitle: "Real-time render",
        tone: "text-violet-600",
      },
    ],
  },
  tools: {
    badge: "Tooling",
    title: "From idea to output in one flow",
    cards: [
      {
        title: "Manim AI Creation",
        desc: "Describe with text and let AnimG build precise mathematical animation drafts.",
        cta: "Create with AI",
        href: "/creator",
        tone: "blue",
      },
      {
        title: "Publish & Discover",
        desc: "Share your animation and explore what others in the community are creating.",
        cta: "Explore community",
        href: "/explore",
        tone: "pink",
      },
      {
        title: "Online Manim Playground",
        desc: "Write Manim code in browser, render fast, and iterate without local setup.",
        cta: "Open Playground",
        href: "/playground",
        tone: "violet",
      },
    ],
  },
  useCases: {
    badge: "Use Cases",
    title: "One platform for teaching, learning, and content creation",
    subtitle:
      "Whether you are an educator, student, or creator, AnimG fits naturally into your workflow.",
    cards: [
      {
        title: "Educator Lessons",
        desc: "Turn abstract formulas and theorems into visual explanations for clearer classroom delivery.",
        cta: "See educator flow",
        href: "/manim-for-educators",
        tone: "emerald",
      },
      {
        title: "Student Self-study",
        desc: "Review calculus, linear algebra, and statistics with step-by-step animated reasoning.",
        cta: "See student flow",
        href: "/manim-for-students",
        tone: "amber",
      },
      {
        title: "Creator Publishing",
        desc: "Produce high-retention math visuals for courses, YouTube, and social channels.",
        cta: "See creator flow",
        href: "/manim-for-youtube",
        tone: "cyan",
      },
    ],
  },
  howToUse: {
    badge: "How AnimG Works",
    title: "Create math animations in 3 steps",
    subtitle: "From idea to final video: describe, align, and render.",
    steps: [
      {
        title: "1. Describe your idea",
        desc: "Enter a natural-language prompt such as “show gradient descent convergence”.",
      },
      {
        title: "2. Review generated draft",
        desc: "AnimG generates a timeline and structure that you can refine with follow-up prompts.",
      },
      {
        title: "3. Render and export",
        desc: "Run rendering in the browser, then publish to community or export for your own content.",
      },
    ],
    cta: "View full workflow",
  },
  faq: {
    badge: "FAQ",
    title: "Frequently asked questions",
    subtitle: "Quick answers on setup, workflow, and export capabilities",
    items: [
      {
        q: "Do I need to install Manim or Python locally?",
        a: "No. AnimG runs in the browser and handles rendering in the cloud workflow.",
      },
      {
        q: "Can I create animations without writing code?",
        a: "Yes. Describe your intent in natural language and AnimG generates a renderable draft.",
      },
      {
        q: "Can I export videos for courses or public content?",
        a: "Yes. After rendering, you can export videos for teaching, course materials, or creator publishing.",
      },
      {
        q: "What if I want precise low-level control?",
        a: "Use follow-up prompts in Creator, or switch to Playground to edit Manim code directly.",
      },
    ],
  },
  community: {
    badge: "Community",
    title: "What people are building",
    subtitle: "Recent mathematical animations from the AnimG community",
    cta: "View all animations",
  },
};

const copyByLocale: Record<Locale, HomeCopy> = {
  zh: zhCopy,
  en: enCopy,
  de: enCopy,
};

function ToolIcon({ tone }: { tone: "blue" | "pink" | "violet" }) {
  const palette = {
    blue: "from-sky-500 to-blue-500 border-sky-300",
    pink: "from-fuchsia-500 to-pink-500 border-fuchsia-300",
    violet: "from-indigo-500 to-violet-500 border-indigo-300",
  } as const;

  return (
    <span
      className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border bg-gradient-to-br text-white shadow-sm ${palette[tone]}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 12h16" />
        <path d="M12 4v16" />
        <circle cx="12" cy="12" r="7" />
      </svg>
    </span>
  );
}

function UseCaseIcon({ tone }: { tone: "emerald" | "amber" | "cyan" }) {
  const palette = {
    emerald: "from-emerald-500 to-teal-500 border-emerald-300",
    amber: "from-amber-500 to-orange-500 border-amber-300",
    cyan: "from-cyan-500 to-sky-500 border-cyan-300",
  } as const;

  return (
    <span
      className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border bg-gradient-to-br text-white shadow-sm ${palette[tone]}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 18V9l8-5 8 5v9" />
        <path d="M9 22v-6h6v6" />
      </svg>
    </span>
  );
}

export default async function LocaleHomePage({ params }: HomePageProps) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const copy = copyByLocale[locale];

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950">
      <section className="relative overflow-hidden border-y border-slate-200/80 bg-[linear-gradient(180deg,rgba(241,245,249,0.95)_0%,rgba(255,255,255,0.98)_100%)] py-20 md:py-24 dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.95)_0%,rgba(2,6,23,0.98)_100%)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px),radial-gradient(circle_at_top,rgba(96,165,250,0.2),transparent_62%),radial-gradient(circle_at_right,rgba(216,180,254,0.14),transparent_54%)] bg-[size:88px_88px,88px_88px,100%_100%,100%_100%]" />

        <div className="relative mx-auto flex max-w-6xl flex-col items-center px-6 text-center md:px-8">
          <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-300">
            {copy.hero.badge}
          </p>

          <h1 className="mt-6 bg-gradient-to-r from-blue-600 to-violet-500 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            {copy.hero.titleTop}
          </h1>
          <h2 className="mt-3 text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            {copy.hero.titleBottom}
          </h2>

          <p className="mt-8 text-base text-slate-600 dark:text-slate-300">
            {copy.hero.hint}
          </p>

          <HomeHeroPrompt locale={locale} placeholder={copy.hero.placeholder} />

          <Link
            href={localePath(locale, "/creator")}
            className="mt-6 inline-flex rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {copy.hero.cta} →
          </Link>

          <div className="mt-10 h-px w-full max-w-4xl bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />
          <div className="mt-10 grid w-full gap-5 sm:grid-cols-3">
            {copy.hero.metrics.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-white px-6 py-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
              >
                <p className={`text-4xl font-bold ${item.tone}`}>
                  {item.title}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {item.subtitle}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-white py-20 md:py-24 dark:border-slate-800/80 dark:bg-slate-950/90">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08)_1px,transparent_1px)] [background-size:7px_7px] opacity-50" />

        <div className="relative mx-auto max-w-6xl px-6 md:px-8">
          <div className="text-center">
            <p className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              {copy.tools.badge}
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              {copy.tools.title}
            </h2>
            <div className="mx-auto mt-8 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {copy.tools.cards.map((item) => (
              <article
                key={item.title}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-sm dark:border-slate-700 dark:bg-slate-900/90"
              >
                <div className="flex flex-col items-center border-b border-slate-200 px-6 py-7 dark:border-slate-700">
                  <ToolIcon tone={item.tone} />
                  <h3 className="mt-4 text-3xl font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                </div>
                <div className="px-6 py-5">
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300">
                    {item.desc}
                  </p>
                  <Link
                    href={localePath(locale, item.href)}
                    className="mt-4 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                  >
                    {item.cta} →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,1)_0%,rgba(241,245,249,1)_100%)] py-20 md:py-24 dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.95)_100%)]">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500">
              {copy.community.badge}
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              {copy.community.title}
            </h2>
            <p className="mt-3 text-lg text-slate-600 dark:text-slate-300 sm:text-xl">
              {copy.community.subtitle}
            </p>
            <div className="mx-auto mt-8 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-slate-300 to-transparent dark:via-slate-700" />
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {communityAnimations.slice(0, 8).map((item) => (
              <Link
                key={item.slug}
                href={localePath(locale, `/animation/${item.slug}`)}
                className="group overflow-hidden rounded-xl bg-black shadow-sm ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-0.5"
                title={item.title}
              >
                <div className="aspect-[16/9]">
                  <Image
                    src={item.thumbnailUrl}
                    alt={item.title}
                    width={640}
                    height={360}
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 100vw"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href={localePath(locale, "/explore")}
              className="inline-flex rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-blue-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300 dark:hover:border-blue-700 dark:hover:text-blue-200"
            >
              {copy.community.cta} →
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(236,253,245,0.45)_0%,rgba(255,255,255,1)_100%)] py-20 md:py-24 dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,rgba(6,78,59,0.15)_0%,rgba(2,6,23,0.98)_100%)]">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="text-center">
            <p className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {copy.useCases.badge}
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              {copy.useCases.title}
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              {copy.useCases.subtitle}
            </p>
            <div className="mx-auto mt-8 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-emerald-300 to-transparent dark:via-emerald-700" />
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {copy.useCases.cards.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/85"
              >
                <UseCaseIcon tone={item.tone} />
                <h3 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {item.desc}
                </p>
                <Link
                  href={localePath(locale, item.href)}
                  className="mt-5 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
                >
                  {item.cta} →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(245,243,255,0.45)_0%,rgba(248,250,252,0.9)_100%)] py-20 md:py-24 dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,rgba(76,29,149,0.15)_0%,rgba(15,23,42,0.95)_100%)]">
        <div className="mx-auto max-w-6xl px-6 md:px-8">
          <div className="text-center">
            <p className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
              {copy.howToUse.badge}
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              {copy.howToUse.title}
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              {copy.howToUse.subtitle}
            </p>
            <div className="mx-auto mt-8 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-violet-300 to-transparent dark:via-violet-700" />
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {copy.howToUse.steps.map((step) => (
              <article
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {step.desc}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href={localePath(locale, "/how-it-works")}
              className="inline-flex rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600"
            >
              {copy.howToUse.cta} →
            </Link>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(180deg,rgba(236,254,255,0.4)_0%,rgba(255,255,255,1)_100%)] py-20 md:py-24 dark:border-slate-800/80 dark:bg-[linear-gradient(180deg,rgba(8,145,178,0.12)_0%,rgba(2,6,23,0.98)_100%)]">
        <div className="mx-auto max-w-5xl px-6 md:px-8">
          <div className="text-center">
            <p className="inline-flex rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
              {copy.faq.badge}
            </p>
            <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              {copy.faq.title}
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
              {copy.faq.subtitle}
            </p>
            <div className="mx-auto mt-8 h-px w-full max-w-3xl bg-gradient-to-r from-transparent via-cyan-300 to-transparent dark:via-cyan-700" />
          </div>

          <div className="mt-8 space-y-4">
            {copy.faq.items.map((item) => (
              <details
                key={item.q}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm open:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:open:bg-slate-900"
              >
                <summary className="cursor-pointer text-base font-semibold text-slate-900 dark:text-white">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
