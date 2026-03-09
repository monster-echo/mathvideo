"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

import { sessionLoginRequestSchema, sessionLoginSuccessResponseSchema } from "@/contracts/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseApiResponseOrThrow } from "@/lib/api/client";
import { auth, hasFirebaseClientConfig } from "@/lib/firebase/client";
import { localePath, type Locale } from "@/lib/i18n";

type SignInModalProps = {
  open: boolean;
  locale: Locale;
  onClose: () => void;
  onSuccess?: () => void;
};

function mapAuthError(error: unknown) {
  if (!(error instanceof Error)) return "Sign in failed. Please retry.";

  if (error.message.includes("CONFIGURATION_NOT_FOUND") || error.message.includes("auth/configuration-not-found")) {
    return "Firebase Authentication is not initialized for this project. Open Firebase Console → Authentication → Get started.";
  }
  if (error.message.includes("auth/operation-not-allowed")) {
    return "Google sign-in is not enabled. Enable Google provider in Firebase Console → Authentication → Sign-in method.";
  }
  if (error.message.includes("auth/invalid-credential")) return "Wrong email or password.";
  if (error.message.includes("auth/user-not-found")) return "Account not found.";
  if (error.message.includes("auth/too-many-requests")) return "Too many attempts. Please try later.";
  if (error.message.includes("auth/popup-closed-by-user")) return "Sign in popup was closed.";
  if (error.message.includes("auth/popup-blocked")) return "Popup was blocked by browser. Please allow popups for this site.";
  if (error.message.includes("auth/unauthorized-domain")) return "Current domain is not in Firebase Authorized domains.";
  if (error.message.includes("timeout of 25000ms exceeded")) {
    return "Server cannot reach Firebase Auth endpoint (request timeout). Check network/proxy and retry.";
  }
  if (!error.message.includes("auth/")) return error.message;

  return "Sign in failed. Please retry.";
}

export function SignInModal({ open, locale, onClose, onSuccess }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

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

  async function onEmailLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!auth) {
      setError("Firebase is not configured. Please set .env.local.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const credentials = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await credentials.user.getIdToken(true);
      await createServerSession(idToken);
      onClose();
      onSuccess?.();
    } catch (authError) {
      setError(mapAuthError(authError));
    } finally {
      setLoading(false);
    }
  }

  async function onGoogleLogin() {
    if (!auth) {
      setError("Firebase is not configured. Please set .env.local.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const credentials = await signInWithPopup(auth, new GoogleAuthProvider());
      const idToken = await credentials.user.getIdToken(true);
      await createServerSession(idToken);
      onClose();
      onSuccess?.();
    } catch (authError) {
      setError(mapAuthError(authError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Close sign in dialog"
        >
          ✕
        </button>

        <div className="mb-4">
          <h2 className="text-2xl font-bold">Sign In</h2>
          <p className="mt-1 text-sm animg-muted">Sign in to your account</p>
        </div>

        {!hasFirebaseClientConfig ? (
          <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            Firebase client config is missing. Sign in requires .env.local setup.
          </p>
        ) : null}

        <form onSubmit={onEmailLogin} className="space-y-3">
          <label className="block text-sm">
            Email
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              required
              className="mt-1"
            />
          </label>

          <label className="block text-sm">
            Password
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              className="mt-1"
            />
          </label>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <Button
          type="button"
          onClick={onGoogleLogin}
          disabled={loading}
          variant="secondary"
          className="mt-3 w-full"
        >
          Sign in with Google
        </Button>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}

        <p className="mt-4 text-xs animg-muted">
          By signing in, you agree to our{" "}
          <Link href={localePath(locale, "/terms")} className="text-blue-600 hover:text-blue-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href={localePath(locale, "/privacy")} className="text-blue-600 hover:text-blue-700">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
