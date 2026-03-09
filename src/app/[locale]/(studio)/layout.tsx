import { SiteHeader } from "@/components/layout/site-header";
import { isLocale, type Locale } from "@/lib/i18n";

type StudioLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function StudioLayout({ children, params }: StudioLayoutProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    return children;
  }

  return (
    <div className="flex h-[100dvh] min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-white">
      <SiteHeader locale={locale as Locale} />
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
