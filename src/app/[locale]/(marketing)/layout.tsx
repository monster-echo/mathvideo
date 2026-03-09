import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { isLocale, type Locale } from "@/lib/i18n";

type MarketingLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function MarketingLayout({ children, params }: MarketingLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return children;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <SiteHeader locale={locale as Locale} />
      <main className="pb-14 pt-8">{children}</main>
      <SiteFooter locale={locale as Locale} />
    </div>
  );
}
