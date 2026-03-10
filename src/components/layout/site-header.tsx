"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { localeFlags, localeNames } from "@/lib/data/animg";
import { localePath, swapLocaleInPath, type Locale } from "@/lib/i18n";

import { SessionActions } from "@/components/layout/session-actions";
import { ThemeToggle } from "@/components/layout/theme-toggle";

type SiteHeaderProps = {
  locale: Locale;
};

type HeaderLink = {
  href: string;
  label: string;
  external?: boolean;
};

const localizedNavLinks: Record<Locale, HeaderLink[]> = {
  en: [
    { href: "/creator", label: "Creator" },
    { href: "/explore", label: "Explore" },
    { href: "/playground", label: "Playground" },
    { href: "/subscription", label: "Pricing" },
  ],
  zh: [
    { href: "/creator", label: "创作" },
    { href: "/explore", label: "发现" },
    { href: "/playground", label: "演练场" },
    { href: "/subscription", label: "价格" },
  ],
  de: [
    { href: "/creator", label: "Creator" },
    { href: "/explore", label: "Explore" },
    { href: "/playground", label: "Playground" },
    { href: "/subscription", label: "Pricing" },
  ],
};

const localizedSupportLabel: Record<Locale, string> = {
  en: "Support",
  zh: "支持",
  de: "Support",
};

const localizedSupportMenuLinks: Record<Locale, HeaderLink[]> = {
  en: [
    { href: "/how-it-works", label: "How AnimG Works" },
    { href: "/examples", label: "Animation Examples" },
    {
      href: "https://docs.manim.community/en/stable/",
      label: "Manim Docs",
      external: true,
    },
    { href: "mailto:animg@voycrew.com", label: "Feedback", external: true },
    {
      href: "https://discord.gg/sqrCJUZHkK",
      label: "Discord Community",
      external: true,
    },
  ],
  zh: [
    { href: "/how-it-works", label: "AnimG 如何工作？" },
    { href: "/examples", label: "动画示例" },
    {
      href: "https://docs.manim.community/en/stable/",
      label: "Manim 文档",
      external: true,
    },
    { href: "mailto:animg@voycrew.com", label: "反馈", external: true },
    {
      href: "https://discord.gg/sqrCJUZHkK",
      label: "Discord 社区",
      external: true,
    },
  ],
  de: [
    { href: "/how-it-works", label: "How AnimG Works" },
    { href: "/examples", label: "Animation Examples" },
    {
      href: "https://docs.manim.community/en/stable/",
      label: "Manim Docs",
      external: true,
    },
    { href: "mailto:animg@voycrew.com", label: "Feedback", external: true },
    {
      href: "https://discord.gg/sqrCJUZHkK",
      label: "Discord Community",
      external: true,
    },
  ],
};

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader({ locale }: SiteHeaderProps) {
  const pathname = usePathname();
  const navItems = localizedNavLinks[locale];
  const supportLabel = localizedSupportLabel[locale];
  const supportItems = localizedSupportMenuLinks[locale];

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur-sm transition-colors duration-300 dark:border-slate-800/50 dark:bg-slate-900/80">
      <div className="flex w-full items-center gap-4 px-6 py-2">
        <Link
          href={localePath(locale, "/")}
          className="flex flex-shrink-0 items-center gap-2"
        >
          <Image
            src="/logo.svg"
            alt="AnimG Logo"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <span className="text-xl font-bold text-blue-600">AnimG</span>
        </Link>

        <nav className="ml-6 hidden flex-1 items-center justify-start md:flex">
          <ul className="flex items-center space-x-6">
            {navItems.map((item) => {
              const href = localePath(locale, item.href);
              const active = isActive(pathname, href);

              return (
                <li key={item.href}>
                  <Link
                    href={href}
                    className={`rounded-md px-2 py-1 text-sm font-semibold transition-colors ${
                      active
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}

            <li>
              <details className="group relative">
                <summary className="list-none cursor-pointer rounded-md px-2 py-1 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-white">
                  <span className="inline-flex items-center gap-1">
                    {supportLabel}
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </span>
                </summary>
                <div className="absolute right-0 top-9 w-56 rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
                  {supportItems.map((item) => {
                    const href = localePath(locale, item.href);
                    return (
                      <Link
                        key={item.href}
                        href={href}
                        className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </details>
            </li>
          </ul>
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <details className="group relative">
            <summary className="min-w-[4rem] list-none cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:text-white dark:hover:bg-slate-800/50">
              <span className="inline-flex items-center gap-1">
                <span>{localeFlags[locale]}</span>
                <span className="hidden sm:inline">{localeNames[locale]}</span>
              </span>
            </summary>
            <div className="absolute right-0 top-10 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {(Object.keys(localeNames) as Locale[]).map((candidate) => (
                <Link
                  key={candidate}
                  href={swapLocaleInPath(pathname, candidate)}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800"
                >
                  <span>{localeFlags[candidate]}</span>
                  <span>{localeNames[candidate]}</span>
                </Link>
              ))}
            </div>
          </details>

          <ThemeToggle />
          <SessionActions locale={locale} />
        </div>
      </div>
    </header>
  );
}
