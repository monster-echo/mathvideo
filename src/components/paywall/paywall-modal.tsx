"use client";

import Link from "next/link";
import { useState } from "react";

import { checkoutRequestSchema, checkoutSuccessResponseSchema, type PaidPlanId } from "@/contracts/billing";
import { getApiErrorMessage, parseWithSchema, readJsonSafely } from "@/lib/api/client";
import { localePath, type Locale } from "@/lib/i18n";

type PaywallModalProps = {
  open: boolean;
  onClose: () => void;
  planId?: PaidPlanId;
  planName?: string;
  monthly?: number;
  yearly?: number;
  discount?: number;
  locale?: Locale;
};

export function PaywallModal({
  open,
  onClose,
  planId = "teacher_pro",
  planName = "Teacher Pro",
  monthly = 29,
  yearly = 24,
  discount = 17,
  locale = "en",
}: PaywallModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function startCheckout() {
    setError("");
    setLoading(true);

    try {
      const payload = checkoutRequestSchema.parse({
        planId,
        billingCycle: "yearly",
        source: "aha_paywall",
      });
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafely(response);

      if (response.status === 401) {
        window.location.href = `${localePath(locale, "/login")}?next=${encodeURIComponent(localePath(locale, "/subscription"))}`;
        return;
      }

      const parsed = parseWithSchema(checkoutSuccessResponseSchema, data);
      if (!response.ok || !parsed) {
        throw new Error(getApiErrorMessage(data) ?? "Failed to create checkout session");
      }

      window.location.href = parsed.checkoutUrl;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Failed to create checkout session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Upgrade moment</p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
              Your first usable animation is ready. Unlock download and full-quality export.
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-700/40 dark:bg-blue-900/20">
          <p className="text-sm text-slate-700 dark:text-slate-200">Recommended plan: {planName}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-50">
            ${yearly}/month <span className="text-sm font-medium text-slate-500 line-through">${monthly}/month</span>
          </p>
          <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">Save around {discount}% with annual billing</p>
        </div>

        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <li>• 1080p / 4K export</li>
          <li>• Download rendered videos</li>
          <li>• Priority rendering queue</li>
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={startCheckout}
            disabled={loading}
            className="animg-button-primary flex-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Processing..." : `Unlock ${planName}`}
          </button>
          <Link href={localePath(locale, "/subscription")} className="animg-button-secondary flex-1">
            View pricing
          </Link>
          <button onClick={onClose} className="animg-button-secondary flex-1">
            Continue free
          </button>
        </div>

        {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      </div>
    </div>
  );
}
