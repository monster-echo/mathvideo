import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, isLocale } from "@/lib/i18n";

export default async function RootPage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isLocale(localeCookie ?? "") ? localeCookie : DEFAULT_LOCALE;
  redirect(`/${locale}`);
}
