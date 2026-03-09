"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { billingPortalSuccessResponseSchema, checkoutRequestSchema, checkoutSuccessResponseSchema, type PaidPlanId } from "@/contracts/billing";
import { LeadCapture } from "@/components/forms/lead-capture";
import { getApiErrorMessage, parseWithSchema, readJsonSafely } from "@/lib/api/client";
import { plans } from "@/lib/data/site";
import { formatCnyFromUsd } from "@/lib/utils/format";

export function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState("");

  const paidPlans = useMemo(() => plans.filter((item) => item.monthlyPrice > 0), []);

  async function startCheckout(planId: string) {
    setError("");

    if (planId === "starter") {
      window.location.href = "/creator";
      return;
    }

    setCheckoutLoadingPlan(planId);

    try {
      const payload = checkoutRequestSchema.parse({
        planId: planId as PaidPlanId,
        billingCycle: annual ? "yearly" : "monthly",
        source: "pricing_page",
      });
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await readJsonSafely(response);

      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent("/subscription")}`;
        return;
      }

      const parsed = parseWithSchema(checkoutSuccessResponseSchema, data);
      if (!response.ok || !parsed) {
        throw new Error(getApiErrorMessage(data) ?? "创建支付会话失败");
      }

      window.location.href = parsed.checkoutUrl;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "创建支付会话失败");
    } finally {
      setCheckoutLoadingPlan(null);
    }
  }

  async function openBillingPortal() {
    setError("");
    setPortalLoading(true);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });
      const data = await readJsonSafely(response);

      if (response.status === 401) {
        window.location.href = `/login?next=${encodeURIComponent("/subscription")}`;
        return;
      }

      const parsed = parseWithSchema(billingPortalSuccessResponseSchema, data);
      if (!response.ok || !parsed) {
        throw new Error(getApiErrorMessage(data) ?? "打开订阅管理失败");
      }

      window.location.href = parsed.url;
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : "打开订阅管理失败");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="math-card bg-gradient-to-br from-blue-50 to-white dark:from-slate-900 dark:to-slate-900">
        <h1 className="text-4xl font-semibold">新定价结构（高转化版）</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          从“功能套餐”升级为“角色价值套餐”：教师、创作者、机构按目标产出计费，更容易形成预算与采购闭环。
        </p>

        <div className="mt-5 inline-flex rounded-lg border border-slate-300 bg-white p-1 text-sm dark:border-slate-700 dark:bg-slate-950">
          <button
            onClick={() => setAnnual(false)}
            className={`rounded-md px-3 py-1.5 ${!annual ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}
          >
            月付
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`rounded-md px-3 py-1.5 ${annual ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}
          >
            年付（推荐）
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {portalLoading ? "跳转中..." : "管理订阅"}
          </button>
          <Link href="/login?next=%2Fsubscription" className="text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
            未登录？先登录再订阅
          </Link>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = annual ? plan.yearlyPrice : plan.monthlyPrice;
          const isPopular = plan.id === "teacher_pro";

          return (
            <article
              key={plan.id}
              className={`math-card flex flex-col p-5 ${isPopular ? "border-blue-300 dark:border-blue-700" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                {isPopular ? <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">最受欢迎</span> : null}
              </div>

              <p className="mt-3 text-3xl font-bold">
                {formatCnyFromUsd(price)}
                <span className="text-sm font-medium text-slate-500">/月</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {plan.highlights.map((highlight) => (
                  <li key={highlight}>• {highlight}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => startCheckout(plan.id)}
                disabled={checkoutLoadingPlan === plan.id}
                className={`mt-5 rounded-lg px-3 py-2 text-sm font-semibold ${
                  isPopular
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {checkoutLoadingPlan === plan.id ? "处理中..." : plan.cta}
              </button>
            </article>
          );
        })}
      </section>

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300">
          {error}
        </p>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {paidPlans.map((plan) => (
          <div key={`${plan.id}-why`} className="math-card p-5">
            <p className="text-xs uppercase tracking-wide text-blue-600">{plan.name}</p>
            <p className="mt-2 text-lg font-semibold">为什么这个套餐更容易付费？</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              不是卖“功能按钮”，而是卖“可计量结果”：时间节省、可交付内容、商业可用性。
            </p>
          </div>
        ))}
      </section>

      <section className="math-card">
        <h2 className="text-2xl font-semibold">获取采购建议与迁移清单</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">留下邮箱，我们会按你的角色发一份“付费转化改造清单”。</p>
        <div className="mt-4">
          <LeadCapture source="pricing_page" segment="pricing" buttonLabel="获取清单" />
        </div>
      </section>
    </div>
  );
}
