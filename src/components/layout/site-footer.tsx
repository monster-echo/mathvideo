import Link from "next/link";

import { localePath, type Locale } from "@/lib/i18n";

type SiteFooterProps = {
  locale: Locale;
};

type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

type FooterCopy = {
  columns: Array<{ title: string; links: FooterLink[] }>;
  copyright: string;
  discordLabel: string;
};

const zhFooterCopy: FooterCopy = {
  columns: [
    {
      title: "产品",
      links: [
        { href: "/creator", label: "AI 数学动画" },
        { href: "/playground", label: "Manim 在线演练场" },
        { href: "/explore", label: "浏览动画" },
        { href: "/examples", label: "动画示例" },
      ],
    },
    {
      title: "适用场景",
      links: [
        { href: "/manim-for-educators", label: "教师/教学" },
        { href: "/manim-for-students", label: "学生/自学" },
        { href: "/manim-for-youtube", label: "内容创作者" },
      ],
    },
    {
      title: "资源",
      links: [
        { href: "/how-it-works", label: "AnimG 工作原理" },
        { href: "/subscription", label: "价格" },
        { href: "mailto:animg@voycrew.com", label: "支持", external: true },
      ],
    },
    {
      title: "法律信息",
      links: [
        { href: "/terms", label: "服务条款" },
        { href: "/privacy", label: "隐私政策" },
        { href: "/refund", label: "退款政策" },
      ],
    },
  ],
  copyright: "© 2026 AnimG · VoyCrew Studio",
  discordLabel: "Discord 社区",
};

const enFooterCopy: FooterCopy = {
  columns: [
    {
      title: "Product",
      links: [
        { href: "/creator", label: "AI Animation Creator" },
        { href: "/playground", label: "Online Manim Playground" },
        { href: "/explore", label: "Explore Animations" },
        { href: "/examples", label: "Animation Examples" },
      ],
    },
    {
      title: "Use Cases",
      links: [
        { href: "/manim-for-educators", label: "Manim for Educators" },
        { href: "/manim-for-students", label: "Manim for Students" },
        { href: "/manim-for-youtube", label: "Manim for YouTube" },
      ],
    },
    {
      title: "Resources",
      links: [
        { href: "/how-it-works", label: "How It Works" },
        { href: "/subscription", label: "Pricing" },
        { href: "mailto:animg@voycrew.com", label: "Support", external: true },
      ],
    },
    {
      title: "Legal",
      links: [
        { href: "/terms", label: "Terms" },
        { href: "/privacy", label: "Privacy" },
        { href: "/refund", label: "Refund" },
      ],
    },
  ],
  copyright: "© 2026 AnimG by VoyCrew Studio",
  discordLabel: "Discord Community",
};

const footerCopyByLocale: Record<Locale, FooterCopy> = {
  zh: zhFooterCopy,
  en: enFooterCopy,
  de: enFooterCopy,
};

function FooterColumn({ title, links, locale }: { title: string; links: FooterLink[]; locale: Locale }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((item) => (
          <li key={`${title}-${item.href}`}>
            <Link
              href={localePath(locale, item.href)}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              target={item.external ? "_blank" : undefined}
              rel={item.external ? "noopener noreferrer" : undefined}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter({ locale }: SiteFooterProps) {
  const copy = footerCopyByLocale[locale];

  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="animg-container py-10">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {copy.columns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} locale={locale} />
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <p>{copy.copyright}</p>
          <a
            href="https://discord.gg/sqrCJUZHkK"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            {copy.discordLabel}
          </a>
        </div>
      </div>
    </footer>
  );
}
