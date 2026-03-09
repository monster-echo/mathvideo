import { NextResponse } from "next/server";

import { createAnimationShareRequestSchema } from "@/contracts/animations";
import { getFeaturedAnimations } from "@/lib/data/animations";
import { getSessionUser } from "@/lib/auth/session";
import { adminDb } from "@/lib/firebase/admin";
import { getChatThreadForOwner } from "@/lib/server/chat-threads";
import { logServerEvent } from "@/lib/server/logger";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/server/rate-limit";
import { getClientIp, readJsonBody } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

export async function GET() {
  const items = await getFeaturedAnimations();

  return NextResponse.json({ items });
}

function getOwnerKey(request: Request, uid?: string) {
  if (uid) return `user:${uid}`;
  return `guest:${getClientIp(request)}`;
}

function slugify(text: string) {
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return normalized || "thread-share";
}

function formatDuration(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minute = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minute}:${sec}`;
}

function fallbackThumbnailDataUrl(title: string) {
  const safeTitle = title.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#1d4ed8'/><stop offset='55%' stop-color='#4338ca'/><stop offset='100%' stop-color='#0891b2'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='60' y='360' fill='white' font-size='48' font-family='Arial, Helvetica, sans-serif'>${safeTitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function toDisplayCreatedAt(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit({
    key: `animations:share:${ip}`,
    max: 12,
    windowMs: 60_000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "请求过于频繁，请稍后再试" },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimit, 12),
      },
    );
  }

  if (!adminDb) {
    return NextResponse.json(
      { error: "Firestore is unavailable. Share to community requires server Firestore." },
      { status: 503, headers: getRateLimitHeaders(rateLimit, 12) },
    );
  }

  const sessionUser = await getSessionUser(request);
  const ownerKey = getOwnerKey(request, sessionUser?.uid);

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(createAnimationShareRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const thread = await getChatThreadForOwner(ownerKey, validated.data.threadId);
  if (!thread) {
    return NextResponse.json({ error: "Thread not found." }, { status: 404 });
  }

  const tasks = thread.tasks ?? [];
  const explicitTask = validated.data.taskId ? tasks.find((item) => item.id === validated.data.taskId) : undefined;
  const latestRenderedTask = [...tasks].find((item) => item.renderStatus === "succeeded" && item.renderOutput?.videoUrl);
  const candidateTask = explicitTask ?? latestRenderedTask ?? tasks[0];

  if (!candidateTask) {
    return NextResponse.json({ error: "该线程还没有可分享的任务，请先保存一个任务。" }, { status: 400 });
  }

  if (!candidateTask.renderOutput?.videoUrl) {
    return NextResponse.json({ error: "该任务还没有可分享的视频，请先完成一次渲染。" }, { status: 400 });
  }

  const createdIso = new Date().toISOString();
  const id = crypto.randomUUID();
  const title = (thread.title || candidateTask.title || "Shared Animation").trim();
  const summary = (candidateTask.report || "").trim().slice(0, 500) || "Shared from creator thread.";
  const slug = `${slugify(title)}-${id.slice(0, 8)}`;
  const tags = Array.from(new Set(["creator", "thread-share", "manim"]));
  const authorName =
    (sessionUser?.name?.trim() || sessionUser?.email?.split("@")[0] || `Guest ${ip === "unknown" ? "User" : ip}`)?.slice(0, 60) ??
    "AnimG User";

  const duration = formatDuration(candidateTask.renderOutput.durationSec);
  const createdAtDisplay = toDisplayCreatedAt(createdIso);

  const payload = {
    slug,
    title,
    description: summary,
    summary,
    tags,
    duration,
    createdAt: createdIso,
    createdAtDisplay,
    authorName,
    author: authorName,
    aiModel: process.env.DEEPSEEK_MODEL?.trim() || "deepseek-chat",
    status: "Completed",
    thumbnailUrl: fallbackThumbnailDataUrl(title),
    videoUrl: candidateTask.renderOutput.videoUrl,
    specMarkdown: candidateTask.report || `## ${title}\n\nShared from creator thread.`,
    code: candidateTask.code,
    sourceThreadId: thread.id,
    sourceTaskId: candidateTask.id,
    ownerKey,
  };

  try {
    await adminDb.collection("animations").doc(id).set(payload, { merge: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    logServerEvent("error", "animation_share_create_failed", {
      ownerKey,
      threadId: thread.id,
      taskId: candidateTask.id,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json(
    {
      ok: true,
      item: {
        id,
        slug,
        title,
      },
    },
    {
      headers: getRateLimitHeaders(rateLimit, 12),
    },
  );
}
