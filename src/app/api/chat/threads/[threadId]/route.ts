import { NextResponse } from "next/server";

import { chatThreadResponseSchema, chatThreadUpdateRequestSchema } from "@/contracts/chat";
import { getSessionUser } from "@/lib/auth/session";
import { deleteChatThreadForOwner, getChatThreadForOwner, upsertChatThreadData } from "@/lib/server/chat-threads";
import { logServerEvent } from "@/lib/server/logger";
import { getClientIp, readJsonBody } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

type RouteContext = {
  params: Promise<{ threadId: string }>;
};

function getOwnerKey(request: Request, uid?: string) {
  if (uid) return `user:${uid}`;
  return `guest:${getClientIp(request)}`;
}

export async function GET(request: Request, context: RouteContext) {
  const { threadId } = await context.params;
  const sessionUser = await getSessionUser(request);
  const ownerKey = getOwnerKey(request, sessionUser?.uid);

  try {
    const thread = await getChatThreadForOwner(ownerKey, threadId);
    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    const payload = { ok: true as const, thread };
    const parsed = validateBody(chatThreadResponseSchema, payload);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 500 });
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "加载线程详情失败";
    logServerEvent("error", "chat_thread_get_failed", {
      ownerKey,
      threadId,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const { threadId } = await context.params;
  const sessionUser = await getSessionUser(request);
  const ownerKey = getOwnerKey(request, sessionUser?.uid);

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(chatThreadUpdateRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const thread = await upsertChatThreadData({
      ownerKey,
      threadId,
      title: validated.data.title,
      messages: validated.data.messages,
      tasks: validated.data.tasks,
      suggestedTitle: validated.data.title,
    });

    return NextResponse.json({ ok: true, thread });
  } catch (error) {
    const message = error instanceof Error ? error.message : "更新线程失败";
    logServerEvent("error", "chat_thread_update_failed", {
      ownerKey,
      threadId,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { threadId } = await context.params;
  const sessionUser = await getSessionUser(request);
  const ownerKey = getOwnerKey(request, sessionUser?.uid);

  try {
    const deleted = await deleteChatThreadForOwner(ownerKey, threadId);
    if (!deleted) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除线程失败";
    logServerEvent("error", "chat_thread_delete_failed", {
      ownerKey,
      threadId,
      error: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
