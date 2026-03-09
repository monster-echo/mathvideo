"use client";

import { useState } from "react";

import { billingPortalSuccessResponseSchema, checkoutRequestSchema, checkoutSuccessResponseSchema } from "@/contracts/billing";
import { getApiErrorMessage, parseWithSchema, readJsonSafely } from "@/lib/api/client";
import { localePath, type Locale } from "@/lib/i18n";

export function SubscriptionClient({ locale }: { locale: Locale }) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  async function startCheckout() {
    setError("");
    setCheckoutLoading(true);

    try {
      const payload = checkoutRequestSchema.parse({
        planId: "teacher_pro",
        billingCycle: "monthly",
        source: "pricing_page",
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
      setCheckoutLoading(false);
    }
  }

  async function openBillingPortal() {
    setError("");
    setPortalLoading(true);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = await readJsonSafely(response);

      if (response.status === 401) {
        window.location.href = `${localePath(locale, "/login")}?next=${encodeURIComponent(localePath(locale, "/subscription"))}`;
        return;
      }

      const parsed = parseWithSchema(billingPortalSuccessResponseSchema, data);
      if (!response.ok || !parsed) {
        throw new Error(getApiErrorMessage(data) ?? "Failed to open billing portal");
      }

      window.location.href = parsed.url;
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="animg-container">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Choose Your Plan</h1>
        <p className="mt-2 text-lg animg-muted">
          Start creating animations for free, or upgrade to Pro for unlimited access to all features.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="animg-card p-6">
          <p className="text-sm font-semibold text-slate-500">Current Plan</p>
          <h2 className="mt-2 text-2xl font-bold">Free</h2>
          <p className="mt-2 text-4xl font-bold">$0</p>
          <p className="mt-1 text-sm animg-muted">Perfect for trying out AnimG</p>

          <ul className="mt-4 space-y-2 text-sm animg-muted">
            <li>• Create up to 2 animations</li>
            <li>• Access to limited AI models</li>
            <li>• 3 playground renders per day</li>
            <li>• No video download</li>
            <li>• No updates to completed animations</li>
          </ul>
        </section>

        <section className="animg-card border-blue-300 p-6 dark:border-blue-700/60">
          <p className="inline-flex rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
            Pro
          </p>
          <h2 className="mt-2 text-2xl font-bold">Pro</h2>
          <p className="mt-2 text-3xl font-bold">
            <span className="text-slate-400 line-through">$10.00</span>
            <span className="ml-2">$7.00</span>
            <span className="ml-1 text-base font-medium animg-muted">/month</span>
          </p>
          <p className="mt-1 text-sm text-blue-600">30% off</p>

          <ul className="mt-4 space-y-2 text-sm animg-muted">
            <li>• Create unlimited animations</li>
            <li>• Update completed animations</li>
            <li>• Access all advanced AI models</li>
            <li>• Unlimited playground renders</li>
            <li>• Download videos</li>
            <li>• Priority support</li>
          </ul>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={startCheckout}
              disabled={checkoutLoading}
              className="animg-button-primary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutLoading ? "Processing..." : "Subscribe Now"}
            </button>
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="animg-button-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {portalLoading ? "Opening..." : "Manage Billing"}
            </button>
          </div>
        </section>
      </div>

      {error ? (
        <p className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
