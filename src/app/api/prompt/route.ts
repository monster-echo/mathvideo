import { NextResponse } from "next/server";

import { promptAiBridgeResponseSchema, promptRequestSchema, type SceneSpec } from "@/contracts/prompt";
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
    key: `prompt:${ip}`,
    max: 20,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit, 20),
      },
    );
  }

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(promptRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const { prompt, persona } = validated.data;

  const payload = {
    prompt,
    persona,
    userId: sessionUser?.uid ?? null,
    userEmail: sessionUser?.email ?? null,
    createdAt: new Date().toISOString(),
    source: "creator_page",
  };

  if (adminDb) {
    try {
      await adminDb.collection("promptEvents").add(payload);
    } catch (error) {
      logServerEvent("warn", "prompt_event_write_failed", {
        persona,
        userId: sessionUser?.uid,
        ip,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
  }

  // Optional external AI bridge; fallback keeps local development unblocked.
  const aiApiUrl = process.env.AI_API_URL;
  const aiApiKey = process.env.AI_API_KEY;
  let fallbackReason: string | undefined;

  if (aiApiUrl && aiApiKey) {
    try {
      const timeoutController = new AbortController();
      const timeout = setTimeout(() => timeoutController.abort(), 8000);

      const aiResponse = await fetch(aiApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${aiApiKey}`,
        },
        signal: timeoutController.signal,
        body: JSON.stringify({
          prompt,
          persona,
          language: "zh-CN",
        }),
      }).finally(() => clearTimeout(timeout));

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const parsed = validateBody(promptAiBridgeResponseSchema, aiData);

        if (parsed.ok) {
          return NextResponse.json(
            {
              ok: true,
              sceneSpec: {
                title: parsed.data.sceneSpec.title,
                timeline: parsed.data.sceneSpec.timeline,
                estimatedRenderTime: parsed.data.sceneSpec.estimatedRenderTime,
              },
              ahaReady: true,
              source: "external_ai",
            },
            {
              headers: getRateLimitHeaders(rateLimit, 20),
            },
          );
        }

        fallbackReason = "external_ai_schema_invalid";
        logServerEvent("warn", "external_ai_invalid_schema", {
          persona,
          userId: sessionUser?.uid,
          ip,
          promptLength: prompt.length,
          detail: parsed.error,
        });
      } else {
        fallbackReason = `external_ai_status_${aiResponse.status}`;
        logServerEvent("warn", "external_ai_http_error", {
          persona,
          userId: sessionUser?.uid,
          ip,
          promptLength: prompt.length,
          status: aiResponse.status,
        });
      }
    } catch (error) {
      fallbackReason =
        error instanceof Error && error.name === "AbortError" ? "external_ai_timeout" : "external_ai_request_failed";
      logServerEvent("warn", "external_ai_request_failed", {
        persona,
        userId: sessionUser?.uid,
        ip,
        promptLength: prompt.length,
        reason: fallbackReason,
        error: error instanceof Error ? error.message : "unknown_error",
      });
    }
  } else {
    fallbackReason = "external_ai_not_configured";
    logServerEvent("info", "external_ai_not_configured", {
      persona,
      userId: sessionUser?.uid,
      ip,
      promptLength: prompt.length,
    });
  }

  const sceneSpec: SceneSpec = {
    title: "自动生成场景草案",
    timeline: [
      "0-2s：建立坐标系与标题",
      "2-6s：核心公式渐进展示",
      "6-10s：图像/几何变换动画",
      "10-12s：结论与课堂提问",
    ],
    estimatedRenderTime: "45s",
  };

  return NextResponse.json(
    {
      ok: true,
      sceneSpec,
      ahaReady: true,
      source: "local_fallback",
      fallbackReason,
    },
    {
      headers: getRateLimitHeaders(rateLimit, 20),
    },
  );
}
