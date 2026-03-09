import { NextResponse } from "next/server";

import { checkoutRequestSchema } from "@/contracts/billing";
import { getSessionUser } from "@/lib/auth/session";
import type { BillingCycle, PaidPlanId } from "@/lib/billing/stripe";
import { getAppBaseUrl, getStripeClient, getStripePriceId } from "@/lib/billing/stripe";
import { getSubscriptionByUid, upsertSubscription } from "@/lib/billing/subscription";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit({
    key: `billing_checkout:${ip}`,
    max: 12,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: getRateLimitHeaders(rateLimit, 12) },
    );
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "请先登录后再升级" }, { status: 401 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe 未配置，暂不可创建支付" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const validated = validateBody(checkoutRequestSchema, body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { planId, billingCycle, source } = validated.data;
  const priceId = getStripePriceId(planId, billingCycle);
  if (!priceId) {
    return NextResponse.json(
      { error: `未配置 ${planId}/${billingCycle} 的 Stripe Price ID` },
      { status: 503 },
    );
  }

  const existingSubscription = await getSubscriptionByUid(user.uid);
  let stripeCustomerId = existingSubscription?.stripeCustomerId ?? null;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { uid: user.uid },
    });
    stripeCustomerId = customer.id;

    await upsertSubscription(user.uid, {
      stripeCustomerId,
    });
  }

  const baseUrl = getAppBaseUrl(request.url);
  const successUrl = `${baseUrl}/subscription?checkout=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/subscription?checkout=cancel`;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    client_reference_id: user.uid,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
    metadata: {
      uid: user.uid,
      planId,
      billingCycle,
      source: source ?? "pricing_page",
    },
    subscription_data: {
      metadata: {
        uid: user.uid,
        planId,
        billingCycle,
      },
    },
  });

  await upsertSubscription(user.uid, {
    planId: planId as PaidPlanId,
    cycle: billingCycle as BillingCycle,
    stripePriceId: priceId,
    stripeCustomerId,
    status: "incomplete",
  });

  return NextResponse.json(
    {
      ok: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    },
    {
      headers: getRateLimitHeaders(rateLimit, 12),
    },
  );
}
