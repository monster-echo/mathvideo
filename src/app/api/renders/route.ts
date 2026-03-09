import { NextResponse } from "next/server";

import { createRenderRequestSchema, listRendersQuerySchema } from "@/contracts/renders";
import { getRequestEntitlement } from "@/lib/auth/entitlements";
import {
  cancelQueuedRenderJobForOwner,
  createRenderJob,
  getRenderJobForOwner,
  listRenderJobsForOwner,
} from "@/lib/server/render-jobs";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const entitlement = await getRequestEntitlement(request);
  const ownerKey = entitlement.user ? `uid:${entitlement.user.uid}` : `ip:${ip}`;
  const rateLimit = checkRateLimit({
    key: `renders:post:${ip}`,
    max: 6,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "渲染请求过于频繁，请稍后再试" },
      { status: 429, headers: getRateLimitHeaders(rateLimit, 6) },
    );
  }

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(createRenderRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  if (validated.data.quality === "1080p" && !entitlement.paidActive) {
    return NextResponse.json(
      {
        error: entitlement.user ? "当前账户无 1080p 导出权限，请先升级订阅" : "请先登录并升级订阅后使用 1080p 导出",
      },
      { status: 402 },
    );
  }

  const job = createRenderJob({
    ...validated.data,
    ownerKey,
  });
  return NextResponse.json(
    {
      ok: true,
      job: await job,
    },
    {
      headers: getRateLimitHeaders(rateLimit, 6),
    },
  );
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  const entitlement = await getRequestEntitlement(request);
  const ownerKey = entitlement.user ? `uid:${entitlement.user.uid}` : `ip:${ip}`;
  const rateLimit = checkRateLimit({
    key: `renders:get:${ip}`,
    max: 60,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "查询过于频繁，请稍后再试" },
      { status: 429, headers: getRateLimitHeaders(rateLimit, 60) },
    );
  }

  const { searchParams } = new URL(request.url);
  const queryValidated = validateBody(listRendersQuerySchema, {
    id: searchParams.get("id") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!queryValidated.ok) {
    return NextResponse.json({ error: queryValidated.error }, { status: 400 });
  }

  const { id, limit } = queryValidated.data;

  if (!id) {
    const items = await listRenderJobsForOwner(ownerKey, limit);
    return NextResponse.json(
      {
        ok: true,
        items,
      },
      {
        headers: getRateLimitHeaders(rateLimit, 60),
      },
    );
  }

  const job = await getRenderJobForOwner(id, ownerKey);
  if (!job) {
    return NextResponse.json({ error: "任务不存在、已过期或无权访问" }, { status: 404 });
  }

  return NextResponse.json(
    {
      ok: true,
      job,
    },
    {
      headers: getRateLimitHeaders(rateLimit, 60),
    },
  );
}

export async function DELETE(request: Request) {
  const ip = getClientIp(request);
  const entitlement = await getRequestEntitlement(request);
  const ownerKey = entitlement.user ? `uid:${entitlement.user.uid}` : `ip:${ip}`;
  const rateLimit = checkRateLimit({
    key: `renders:delete:${ip}`,
    max: 30,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "操作过于频繁，请稍后再试" },
      { status: 429, headers: getRateLimitHeaders(rateLimit, 30) },
    );
  }

  const { searchParams } = new URL(request.url);
  const queryValidated = validateBody(listRendersQuerySchema, {
    id: searchParams.get("id") ?? undefined,
    limit: 1,
  });

  if (!queryValidated.ok || !queryValidated.data.id) {
    return NextResponse.json({ error: "缺少任务 ID" }, { status: 400 });
  }

  const cancelled = await cancelQueuedRenderJobForOwner(queryValidated.data.id, ownerKey);
  if (cancelled.status === "not_found") {
    return NextResponse.json({ error: "任务不存在、已过期或无权访问" }, { status: 404 });
  }

  if (cancelled.status === "not_queued") {
    return NextResponse.json({ error: "仅支持取消排队中的任务" }, { status: 409 });
  }

  return NextResponse.json(
    {
      ok: true,
      job: cancelled.job,
    },
    {
      headers: getRateLimitHeaders(rateLimit, 30),
    },
  );
}
