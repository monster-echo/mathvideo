import { NextResponse } from "next/server";

import { ahaOfferRequestSchema } from "@/contracts/aha-offer";
import { getSessionUser } from "@/lib/auth/session";
import { plans } from "@/lib/data/site";
import { adminDb } from "@/lib/firebase/admin";
import { logServerEvent } from "@/lib/server/logger";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const sessionUser = await getSessionUser(request);
  const rateLimit = checkRateLimit({
    key: `aha-offer:${ip}`,
    max: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit, 30),
      },
    );
  }

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(ahaOfferRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { persona, trigger } = validated.data;

  const offerPlan =
    plans.find((item) => item.audience === persona) ?? plans.find((item) => item.id === "teacher_pro");

  const eventPayload = {
    persona,
    trigger,
    userId: sessionUser?.uid ?? null,
    userEmail: sessionUser?.email ?? null,
    createdAt: new Date().toISOString(),
    offerPlanId: offerPlan?.id,
  };

  if (adminDb) {
    try {
      await adminDb.collection("ahaEvents").add(eventPayload);
    } catch (error) {
      logServerEvent("warn", "aha_event_write_failed", {
        persona,
        trigger,
        userId: sessionUser?.uid,
        ip,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  return NextResponse.json(
    {
      ok: true,
      offer: {
        headline: "你已经完成第一个可用动画，升级后可直接用于授课/发布",
        planId: offerPlan?.id,
        planName: offerPlan?.name,
        monthly: offerPlan?.monthlyPrice,
        yearly: offerPlan?.yearlyPrice,
        discount: Math.round((((offerPlan?.monthlyPrice ?? 0) - (offerPlan?.yearlyPrice ?? 0)) / Math.max(offerPlan?.monthlyPrice ?? 1, 1)) * 100),
      },
    },
    {
      headers: getRateLimitHeaders(rateLimit, 30),
    },
  );
}
