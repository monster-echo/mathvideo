import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/session";
import { getAppBaseUrl, getStripeClient } from "@/lib/billing/stripe";
import { getSubscriptionByUid } from "@/lib/billing/subscription";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/request";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit({
    key: `billing_portal:${ip}`,
    max: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      { status: 429, headers: getRateLimitHeaders(rateLimit, 20) },
    );
  }

  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe 未配置" }, { status: 503 });
  }

  const subscription = await getSubscriptionByUid(user.uid);
  if (!subscription?.stripeCustomerId) {
    return NextResponse.json({ error: "未找到可管理的订阅账户" }, { status: 404 });
  }

  const baseUrl = getAppBaseUrl(request.url);
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${baseUrl}/subscription?portal=return`,
  });

  return NextResponse.json(
    {
      ok: true,
      url: portalSession.url,
    },
    {
      headers: getRateLimitHeaders(rateLimit, 20),
    },
  );
}
