import type { UIMessage } from "ai";
import type { ChatThreadTask } from "@/contracts/chat";

import { adminDb } from "@/lib/firebase/admin";
import { logServerEvent } from "@/lib/server/logger";

type ChatThreadRecord = {
  id: string;
  ownerKey: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  taskCount: number;
  lastMessagePreview?: string;
  messages: UIMessage[];
  tasks: ChatThreadTask[];
};

export type ChatThreadSummaryRecord = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  taskCount: number;
  lastMessagePreview?: string;
};

export type ChatThreadDetailRecord = ChatThreadSummaryRecord & {
  messages: UIMessage[];
  tasks: ChatThreadTask[];
};

const COLLECTION_NAME = "chatThreads";
const ADMIN_DB_TIMEOUT_MS = 4000;

function normalizeFirestoreError(error: unknown): Error {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const code = typeof (error as { code?: unknown })?.code === "number" ? Number((error as { code: number }).code) : null;

  if (rawMessage.includes("_timeout")) {
    return new Error("Firestore request timed out. Please retry.");
  }

  if (code === 5) {
    return new Error(
      "Firestore database not found. Create a Firestore database for this project, or set FIREBASE_FIRESTORE_DATABASE_ID if you use a non-default database.",
    );
  }

  if (code === 7) {
    return new Error("Firestore permission denied. Verify service account IAM permissions.");
  }

  return error instanceof Error ? error : new Error(rawMessage);
}

function getFirestoreOrThrow() {
  if (!adminDb) {
    const error = new Error("Firestore is unavailable: missing Firebase Admin configuration.");
    logServerEvent("error", "chat_threads_firestore_unavailable", {
      collection: COLLECTION_NAME,
    });
    throw error;
  }

  return adminDb;
}

function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label}_timeout`));
    }, ADMIN_DB_TIMEOUT_MS);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function nowIso() {
  return new Date().toISOString();
}

function extractTextFromMessage(message: UIMessage | undefined): string {
  if (!message || !Array.isArray(message.parts)) return "";

  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => ("text" in part ? String(part.text ?? "") : ""))
    .join(" ")
    .trim();
}

function titleFromMessages(messages: UIMessage[], fallbackTitle: string): string {
  const firstUserText = messages
    .filter((message) => message.role === "user")
    .map((message) => extractTextFromMessage(message))
    .find((item) => item.length > 0);

  if (!firstUserText) return fallbackTitle;
  return firstUserText.length > 48 ? `${firstUserText.slice(0, 48)}...` : firstUserText;
}

function normalizeMessages(value: unknown): UIMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return typeof record.id === "string" && typeof record.role === "string" && Array.isArray(record.parts);
    })
    .map((item) => item as UIMessage);
}

function normalizeTasks(value: unknown): ChatThreadTask[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item) => {
      if (!item || typeof item !== "object") return false;
      const record = item as Record<string, unknown>;
      return (
        typeof record.id === "string" &&
        typeof record.title === "string" &&
        typeof record.report === "string" &&
        typeof record.code === "string" &&
        typeof record.createdAt === "string" &&
        typeof record.updatedAt === "string"
      );
    })
    .map((item) => {
      const record = item as Record<string, unknown>;
      const outputValue = record.renderOutput as Record<string, unknown> | undefined;

      return {
        id: String(record.id),
        title: String(record.title),
        report: String(record.report),
        code: String(record.code),
        sourceMessageId: typeof record.sourceMessageId === "string" ? record.sourceMessageId : undefined,
        sourcePartIndex: typeof record.sourcePartIndex === "number" ? record.sourcePartIndex : undefined,
        createdAt: String(record.createdAt),
        updatedAt: String(record.updatedAt),
        renderQuality: record.renderQuality === "1080p" ? "1080p" : "preview",
        renderJobId: typeof record.renderJobId === "string" ? record.renderJobId : undefined,
        renderStatus:
          record.renderStatus === "queued" ||
          record.renderStatus === "running" ||
          record.renderStatus === "succeeded" ||
          record.renderStatus === "failed"
            ? record.renderStatus
            : undefined,
        renderError: typeof record.renderError === "string" ? record.renderError : undefined,
        renderOutput:
          outputValue && typeof outputValue === "object"
            ? {
                durationSec: Number(outputValue.durationSec ?? 0),
                resolution: String(outputValue.resolution ?? "1280x720"),
                previewText: String(outputValue.previewText ?? ""),
                videoUrl: typeof outputValue.videoUrl === "string" ? outputValue.videoUrl : undefined,
              }
            : undefined,
        renderLogs: Array.isArray(record.renderLogs) ? record.renderLogs.map((item) => String(item)) : undefined,
      } satisfies ChatThreadTask;
    });
}

function fromUnknownRecord(id: string, data: Record<string, unknown>): ChatThreadRecord {
  const messages = normalizeMessages(data.messages);
  const tasks = normalizeTasks(data.tasks);

  return {
    id,
    ownerKey: String(data.ownerKey ?? ""),
    title: String(data.title ?? "New Chat"),
    createdAt: String(data.createdAt ?? nowIso()),
    updatedAt: String(data.updatedAt ?? nowIso()),
    messageCount: Number(data.messageCount ?? messages.length ?? 0),
    taskCount: Number(data.taskCount ?? tasks.length ?? 0),
    lastMessagePreview: data.lastMessagePreview ? String(data.lastMessagePreview) : undefined,
    messages,
    tasks,
  };
}

function toSummary(record: ChatThreadRecord): ChatThreadSummaryRecord {
  const { ownerKey: hiddenOwnerKey, messages: hiddenMessages, tasks: hiddenTasks, ...summary } = record;
  void hiddenOwnerKey;
  void hiddenMessages;
  void hiddenTasks;
  return {
    ...summary,
    messageCount: record.messages.length,
    taskCount: record.tasks.length,
  };
}

function toDetail(record: ChatThreadRecord): ChatThreadDetailRecord {
  const summary = toSummary(record);
  const { ownerKey: hiddenOwnerKey, ...detail } = record;
  void hiddenOwnerKey;
  return {
    ...summary,
    messages: detail.messages,
    tasks: detail.tasks,
  };
}

function stripUndefinedDeep(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefinedDeep(item)).filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    const source = value as Record<string, unknown>;
    const target: Record<string, unknown> = {};

    for (const [key, item] of Object.entries(source)) {
      if (item === undefined) continue;
      const next = stripUndefinedDeep(item);
      if (next !== undefined) {
        target[key] = next;
      }
    }

    return target;
  }

  return value;
}

async function saveThread(record: ChatThreadRecord) {
  const db = getFirestoreOrThrow();
  const payload = stripUndefinedDeep(record) as Record<string, unknown>;

  try {
    await withTimeout(db.collection(COLLECTION_NAME).doc(record.id).set(payload, { merge: true }), "chat_thread_write");
  } catch (error) {
    const normalizedError = normalizeFirestoreError(error);
    logServerEvent("error", "chat_thread_write_failed", {
      threadId: record.id,
      ownerKey: record.ownerKey,
      error: normalizedError.message,
    });
    throw normalizedError;
  }
}

async function getThreadById(threadId: string): Promise<ChatThreadRecord | null> {
  const db = getFirestoreOrThrow();

  try {
    const snapshot = await withTimeout(db.collection(COLLECTION_NAME).doc(threadId).get(), "chat_thread_get");
    if (!snapshot.exists) return null;
    const data = snapshot.data();
    if (!data) return null;
    return fromUnknownRecord(snapshot.id, data);
  } catch (error) {
    const normalizedError = normalizeFirestoreError(error);
    logServerEvent("error", "chat_thread_get_failed", {
      threadId,
      error: normalizedError.message,
    });
    throw normalizedError;
  }
}

export async function createChatThread(input: {
  ownerKey: string;
  title?: string;
  initialMessages?: UIMessage[];
  initialTasks?: ChatThreadTask[];
}): Promise<ChatThreadDetailRecord> {
  const id = crypto.randomUUID();
  const createdAt = nowIso();
  const messages = input.initialMessages ?? [];
  const tasks = input.initialTasks ?? [];
  const fallbackTitle = input.title?.trim() || "New Chat";

  const record: ChatThreadRecord = {
    id,
    ownerKey: input.ownerKey,
    title: titleFromMessages(messages, fallbackTitle),
    createdAt,
    updatedAt: createdAt,
    messageCount: messages.length,
    taskCount: tasks.length,
    lastMessagePreview: extractTextFromMessage(messages[messages.length - 1]) || undefined,
    messages,
    tasks,
  };

  await saveThread(record);
  return toDetail(record);
}

export async function listChatThreadsForOwner(ownerKey: string, limitCount = 30): Promise<ChatThreadSummaryRecord[]> {
  const db = getFirestoreOrThrow();

  try {
    const safeSnapshot = await withTimeout(
      db.collection(COLLECTION_NAME).where("ownerKey", "==", ownerKey).orderBy("updatedAt", "desc").limit(limitCount).get(),
      "chat_threads_list",
    );

    return safeSnapshot.docs.map((doc) => toSummary(fromUnknownRecord(doc.id, doc.data())));
  } catch (error) {
    const normalizedError = normalizeFirestoreError(error);
    logServerEvent("error", "chat_threads_list_failed", {
      ownerKey,
      error: normalizedError.message,
    });
    throw normalizedError;
  }
}

export async function getChatThreadForOwner(ownerKey: string, threadId: string): Promise<ChatThreadDetailRecord | null> {
  const thread = await getThreadById(threadId);
  if (!thread || thread.ownerKey !== ownerKey) return null;
  return toDetail(thread);
}

export async function deleteChatThreadForOwner(ownerKey: string, threadId: string): Promise<boolean> {
  const existing = await getThreadById(threadId);
  if (!existing || existing.ownerKey !== ownerKey) return false;

  const db = getFirestoreOrThrow();
  try {
    await withTimeout(db.collection(COLLECTION_NAME).doc(threadId).delete(), "chat_thread_delete");
    return true;
  } catch (error) {
    const normalizedError = normalizeFirestoreError(error);
    logServerEvent("error", "chat_thread_delete_failed", {
      threadId,
      ownerKey,
      error: normalizedError.message,
    });
    throw normalizedError;
  }
}

export async function upsertChatThreadMessages(input: {
  ownerKey: string;
  threadId: string;
  messages: UIMessage[];
  title?: string;
  suggestedTitle?: string;
}): Promise<ChatThreadDetailRecord> {
  return upsertChatThreadData({
    ownerKey: input.ownerKey,
    threadId: input.threadId,
    messages: input.messages,
    title: input.title,
    suggestedTitle: input.suggestedTitle,
  });
}

export async function upsertChatThreadData(input: {
  ownerKey: string;
  threadId: string;
  title?: string;
  messages?: UIMessage[];
  tasks?: ChatThreadTask[];
  suggestedTitle?: string;
}): Promise<ChatThreadDetailRecord> {
  const existing = await getThreadById(input.threadId);
  const timestamp = nowIso();
  const nextMessages = input.messages ?? existing?.messages ?? [];
  const nextTasks = input.tasks ?? existing?.tasks ?? [];
  const existingTitle = existing?.title?.trim();
  const fallbackTitle = input.suggestedTitle?.trim() || existingTitle || "New Chat";
  const preservedTitle = existingTitle && existingTitle !== "New Chat" ? existingTitle : undefined;
  const nextTitle =
    input.title?.trim() ||
    preservedTitle ||
    titleFromMessages(nextMessages, fallbackTitle);

  const next: ChatThreadRecord = {
    id: input.threadId,
    ownerKey: input.ownerKey,
    title: nextTitle,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
    messageCount: nextMessages.length,
    taskCount: nextTasks.length,
    lastMessagePreview: extractTextFromMessage(nextMessages[nextMessages.length - 1]) || undefined,
    messages: nextMessages,
    tasks: nextTasks,
  };

  await saveThread(next);
  return toDetail(next);
}
