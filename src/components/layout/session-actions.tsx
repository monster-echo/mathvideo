"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { authMeResponseSchema } from "@/contracts/auth";
import { parseWithSchema, readJsonSafely } from "@/lib/api/client";
import { localePath, type Locale } from "@/lib/i18n";

type SessionState = {
  loading: boolean;
  authenticated: boolean;
  user: {
    uid: string;
    email?: string | null;
    name?: string | null;
  } | null;
};

type SessionActionsProps = {
  locale: Locale;
};

const sessionCopy: Record<
  Locale,
  {
    signIn: string;
    signOut: string;
    signingOut: string;
    loadingLabel: string;
    account: string;
    accountFallback: string;
    openUserMenu: string;
    creator: string;
    pricing: string;
  }
> = {
  en: {
    signIn: "Sign In",
    signOut: "Sign Out",
    signingOut: "Signing out...",
    loadingLabel: "Loading user profile",
    account: "Account",
    accountFallback: "User",
    openUserMenu: "Open user menu",
    creator: "Creator",
    pricing: "Pricing",
  },
  zh: {
    signIn: "登录",
    signOut: "退出登录",
    signingOut: "正在退出...",
    loadingLabel: "正在加载用户信息",
    account: "账号",
    accountFallback: "用户",
    openUserMenu: "打开用户菜单",
    creator: "创作台",
    pricing: "价格",
  },
  de: {
    signIn: "Sign In",
    signOut: "Sign Out",
    signingOut: "Signing out...",
    loadingLabel: "Loading user profile",
    account: "Account",
    accountFallback: "User",
    openUserMenu: "Open user menu",
    creator: "Creator",
    pricing: "Pricing",
  },
};

export function SessionActions({ locale }: SessionActionsProps) {
  const copy = sessionCopy[locale];
  const [state, setState] = useState<SessionState>({
    loading: true,
    authenticated: false,
    user: null,
  });
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me");
        const data = parseWithSchema(authMeResponseSchema, await readJsonSafely(response));

        if (!cancelled) {
          const nextUser = data?.authenticated ? data.user : null;
          setState({
            loading: false,
            authenticated: Boolean(data?.authenticated),
            user: nextUser
              ? {
                  uid: nextUser.uid,
                  email: nextUser.email ?? null,
                  name: nextUser.name ?? null,
                }
              : null,
          });
        }
      } catch {
        if (!cancelled) {
          setState({
            loading: false,
            authenticated: false,
            user: null,
          });
        }
      }
    }

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    setLogoutLoading(true);

    try {
      await fetch("/api/auth/session-logout", { method: "POST" });
    } finally {
      window.location.href = localePath(locale, "/");
    }
  }

  if (state.loading) {
    return <div className="h-7 w-7 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" aria-label={copy.loadingLabel} />;
  }

  if (state.authenticated) {
    const displayName = (state.user?.name || state.user?.email || copy.accountFallback).trim();
    const displayHint = state.user?.email && state.user.email !== displayName ? state.user.email : state.user?.uid;
    const avatarLetter = displayName.charAt(0).toUpperCase();

    return (
      <details className="group relative">
        <summary
          aria-label={copy.openUserMenu}
          className="list-none cursor-pointer rounded-md px-1 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          <span className="inline-flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
              {avatarLetter}
            </span>
            <span className="hidden max-w-[9rem] truncate text-sm font-medium text-slate-700 dark:text-slate-200 lg:inline">
              {displayName}
            </span>
          </span>
        </summary>

        <div className="absolute right-0 top-11 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <div className="mb-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/60">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{copy.account}</p>
            <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">{displayName}</p>
            {displayHint ? <p className="truncate text-xs text-slate-500 dark:text-slate-400">{displayHint}</p> : null}
          </div>

          <Link
            href={localePath(locale, "/creator")}
            className="block rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copy.creator}
          </Link>
          <Link
            href={localePath(locale, "/subscription")}
            className="block rounded-md px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {copy.pricing}
          </Link>

          <button
            type="button"
            onClick={logout}
            disabled={logoutLoading}
            className="mt-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-rose-300 dark:hover:bg-rose-950/30"
          >
            {logoutLoading ? copy.signingOut : copy.signOut}
          </button>
        </div>
      </details>
    );
  }

  return (
    <Link
      href={`${localePath(locale, "/login")}?next=${encodeURIComponent(localePath(locale, "/creator"))}`}
      className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
      </svg>
      {copy.signIn}
    </Link>
  );
}
