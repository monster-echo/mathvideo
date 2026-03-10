import { NextResponse } from "next/server";

import { chatThreadCreateRequestSchema, chatThreadsListResponseSchema } from "@/contracts/chat";
import { getSessionUser } from "@/lib/auth/session";
import { createChatThread, listChatThreadsForOwner } from "@/lib/server/chat-threads";
import { logServerEvent } from "@/lib/server/logger";
import { getClientIp, readJsonBody } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

export const dynamic = "force-dynamic";

function getOwnerKey(request: Request, uid?: string) {
  if (uid) return `user:${uid}`;
  return `guest:${getClientIp(request)}`;
}

export async function GET(request: Request) {
  const sessionUser = await getSessionUser(request);
  const ownerKey = getOwnerKey(request, sessionUser?.uid);

  try {
    const threads = await listChatThreadsForOwner(ownerKey);
    const payload = {
      ok: true as const,
      threads,
    };

    const parsed = validateBody(chatThreadsListResponseSchema, payload);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 500 });
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "加载线程失败";
    logServerEvent("error", "chat_threads_get_failed", {
      ownerKey,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const sessionUser = await getSessionUser(request);
  const ownerKey = getOwnerKey(request, sessionUser?.uid);

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(chatThreadCreateRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const thread = await createChatThread({
      ownerKey,
      title: validated.data.title,
      initialMessages: validated.data.initialMessages,
      initialTasks: validated.data.initialTasks,
    });

    return NextResponse.json({ ok: true, thread });
  } catch (error) {
    const message = error instanceof Error ? error.message : "创建线程失败";
    logServerEvent("error", "chat_thread_create_failed", {
      ownerKey,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
