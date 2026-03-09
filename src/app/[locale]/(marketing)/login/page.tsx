"use client";

import { FormEvent, useState } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

import { sessionLoginRequestSchema, sessionLoginSuccessResponseSchema } from "@/contracts/auth";
import { parseApiResponseOrThrow } from "@/lib/api/client";
import { auth, hasFirebaseClientConfig } from "@/lib/firebase/client";

function mapAuthError(error: unknown) {
  if (!(error instanceof Error)) return "Sign in failed. Please retry.";
  const code = error.message;

  if (code.includes("auth/invalid-credential")) return "Wrong email or password.";
  if (code.includes("auth/user-not-found")) return "Account not found.";
  if (code.includes("auth/too-many-requests")) return "Too many attempts. Please try later.";
  if (code.includes("auth/popup-closed-by-user")) return "Sign-in popup was closed.";
  if (!code.includes("auth/")) return code;

  return "Sign in failed. Please retry later.";
}

export default function LocaleLoginPage() {
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
      fallbackError: "Failed to create server session",
    });
  }

  function goNext() {
    const nextPath =
      typeof window === "undefined" ? "/en/creator" : new URLSearchParams(window.location.search).get("next") || "/en/creator";
    window.location.href = nextPath;
  }

  async function onEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth) {
      setMessage("Firebase is not configured yet. Please update .env.local.");
      return;
    }

    try {
      setLoading(true);
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credentials.user.getIdToken(true);
      await createServerSession(idToken);
      setMessage("Signed in. Redirecting...");
      goNext();
    } catch (error) {
      setMessage(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleLogin() {
    if (!auth) {
      setMessage("Firebase is not configured yet. Please update .env.local.");
      return;
    }

    try {
      setLoading(true);
      const credentials = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await credentials.user.getIdToken(true);
      await createServerSession(idToken);
      setMessage("Signed in. Redirecting...");
      goNext();
    } catch (error) {
      setMessage(mapAuthError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="animg-container">
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="mt-2 text-sm animg-muted">Sign in to continue creating and exporting animations.</p>

        {!hasFirebaseClientConfig ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Firebase is not configured. Authentication is running in development mode.
          </p>
        ) : null}

        <form onSubmit={onEmailLogin} className="mt-5 space-y-3">
          <label className="block text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </label>
          <label className="block text-sm">
            Password
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
            className="animg-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in with Email"}
          </button>
        </form>

        <button
          type="button"
          onClick={onGoogleLogin}
          disabled={loading}
          className="animg-button-secondary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          Continue with Google
        </button>

        {message ? <p className="mt-3 text-sm animg-muted">{message}</p> : null}
      </div>
    </div>
  );
}
