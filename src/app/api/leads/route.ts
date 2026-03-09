import { NextResponse } from "next/server";

import { leadRequestSchema } from "@/contracts/leads";
import { getSessionUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { logServerEvent } from "@/lib/server/logger";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const sessionUser = await getSessionUser(request);
  const rateLimit = checkRateLimit({
    key: `leads:${ip}`,
    max: 8,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit, 8),
      },
    );
  }

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(leadRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { email, source, segment, message } = validated.data;

  const leadPayload = {
    email,
    source,
    segment,
    message,
    userId: sessionUser?.uid ?? null,
    userEmail: sessionUser?.email ?? null,
    createdAt: new Date().toISOString(),
  };

  if (adminDb) {
    try {
      await adminDb.collection("leadEvents").add(leadPayload);
    } catch (error) {
      logServerEvent("warn", "lead_event_write_failed", {
        userId: sessionUser?.uid,
        ip,
        segment,
        source,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: getRateLimitHeaders(rateLimit, 8),
    },
  );
}
