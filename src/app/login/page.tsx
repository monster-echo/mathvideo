"use client";

import { FormEvent, useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

import { sessionLoginRequestSchema, sessionLoginSuccessResponseSchema } from "@/contracts/auth";
import { parseApiResponseOrThrow } from "@/lib/api/client";
import { auth, hasFirebaseClientConfig } from "@/lib/firebase/client";

function mapAuthError(error: unknown) {
  if (!(error instanceof Error)) return "登录失败，请重试";
  const code = error.message;

  if (code.includes("auth/invalid-credential")) return "账号或密码错误";
  if (code.includes("auth/user-not-found")) return "账号不存在";
  if (code.includes("auth/too-many-requests")) return "尝试次数过多，请稍后再试";
  if (code.includes("auth/popup-closed-by-user")) return "你已关闭登录弹窗";
  if (!code.includes("auth/")) return code;

  return "登录失败，请稍后重试";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createServerSession(idToken: string) {
    const payload = sessionLoginRequestSchema.parse({ idToken });
    const response = await fetch("/api/auth/session-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await parseApiResponseOrThrow({
      response,
      successSchema: sessionLoginSuccessResponseSchema,
      fallbackError: "创建服务端会话失败",
    });
  }

  function goNext() {
    const nextPath =
      typeof window === "undefined"
        ? "/creator"
        : new URLSearchParams(window.location.search).get("next") || "/creator";
    window.location.href = nextPath;
  }

  async function onEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth) {
      setMessage("Firebase 未配置，请先填写 .env.local");
      return;
    }

    try {
      setLoading(true);
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credentials.user.getIdToken(true);
      await createServerSession(idToken);
      setMessage("登录成功，正在跳转...");
      goNext();
    } catch (error) {
      setMessage(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleLogin() {
    if (!auth) {
      setMessage("Firebase 未配置，请先填写 .env.local");
      return;
    }

    try {
      setLoading(true);
      const credentials = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await credentials.user.getIdToken(true);
      await createServerSession(idToken);
      setMessage("Google 登录成功，正在跳转...");
      goNext();
    } catch (error) {
      setMessage(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-3xl font-semibold">登录</h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">登录你的账户继续创作与导出。</p>

      {!hasFirebaseClientConfig ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          当前处于开发模式：配置 Firebase 后可启用真实登录。
        </p>
      ) : null}

      <form onSubmit={onEmailLogin} className="mt-5 space-y-3">
        <label className="block text-sm">
          邮箱
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <label className="block text-sm">
          密码
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "登录中..." : "邮箱登录"}
        </button>
      </form>

      <button
        type="button"
        onClick={onGoogleLogin}
        disabled={loading}
        className="mt-3 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        使用 Google 登录
      </button>

      {message ? <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}
    </div>
  );
}
