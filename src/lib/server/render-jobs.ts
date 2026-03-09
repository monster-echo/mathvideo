import type { RenderJob, RenderJobStatus, RenderOutput, RenderQuality } from "@/contracts/renders";
import { adminDb } from "@/lib/firebase/admin";
import { logServerEvent } from "@/lib/server/logger";

type RenderExecutionMode = "worker-pull";

type RenderJobRecord = RenderJob & {
  ownerKey: string;
  code: string;
  executionMode: RenderExecutionMode;
  claimedAt?: string;
  claimedBy?: string;
};

export type WorkerRenderJob = {
  id: string;
  title: string;
  quality: RenderQuality;
  code: string;
  codeLength: number;
  createdAt: string;
  updatedAt: string;
};

export type CancelQueuedRenderJobResult =
  | { status: "cancelled"; job: RenderJob }
  | { status: "not_found" }
  | { status: "not_queued" };

const COLLECTION_NAME = "renderJobs";
const memoryJobs = new Map<string, RenderJobRecord>();

function nowIso() {
  return new Date().toISOString();
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

function mergeLogs(previous: string[], incoming: string[]): string[] {
  if (incoming.length === 0) return previous.slice(-120);
  const merged = [...previous, ...incoming].map((item) => item.trim()).filter(Boolean);
  return merged.slice(-120);
}

function toPublicJob(record: RenderJobRecord): RenderJob {
  const { ownerKey: hiddenOwnerKey, code: hiddenCode, executionMode: hiddenMode, claimedAt: hiddenClaimedAt, claimedBy: hiddenClaimedBy, ...publicJob } = record;
  void hiddenOwnerKey;
  void hiddenCode;
  void hiddenMode;
  void hiddenClaimedAt;
  void hiddenClaimedBy;
  return publicJob;
}

function toWorkerJob(record: RenderJobRecord): WorkerRenderJob {
  return {
    id: record.id,
    title: record.title,
    quality: record.quality,
    code: record.code,
    codeLength: record.codeLength,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function normalizeOutput(value: unknown): RenderOutput | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  return {
    durationSec: Number(record.durationSec ?? 0),
    resolution: String(record.resolution ?? "1280x720"),
    previewText: String(record.previewText ?? ""),
    videoUrl: typeof record.videoUrl === "string" ? record.videoUrl : undefined,
  };
}

function fromUnknownRecord(id: string, data: Record<string, unknown>): RenderJobRecord {
  return {
    id,
    ownerKey: String(data.ownerKey ?? ""),
    code: String(data.code ?? ""),
    title: String(data.title ?? "Untitled"),
    quality: data.quality === "1080p" ? "1080p" : "preview",
    status: (data.status as RenderJobStatus) ?? "queued",
    codeLength: Number(data.codeLength ?? 0),
    logs: Array.isArray(data.logs) ? data.logs.map((item) => String(item)) : [],
    createdAt: String(data.createdAt ?? nowIso()),
    updatedAt: String(data.updatedAt ?? nowIso()),
    output: normalizeOutput(data.output),
    error: data.error ? String(data.error) : undefined,
    executionMode: "worker-pull",
    claimedAt: typeof data.claimedAt === "string" ? data.claimedAt : undefined,
    claimedBy: typeof data.claimedBy === "string" ? data.claimedBy : undefined,
  };
}

async function saveJob(job: RenderJobRecord) {
  if (adminDb) {
    const payload = stripUndefinedDeep(job) as Record<string, unknown>;
    await adminDb.collection(COLLECTION_NAME).doc(job.id).set(payload, { merge: true });
    return;
  }

  memoryJobs.set(job.id, job);
}

async function getJobById(id: string): Promise<RenderJobRecord | null> {
  if (adminDb) {
    const snapshot = await adminDb.collection(COLLECTION_NAME).doc(id).get();
    if (!snapshot.exists) return null;

    const data = snapshot.data();
    if (!data) return null;
    return fromUnknownRecord(snapshot.id, data);
  }

  return memoryJobs.get(id) ?? null;
}

async function listJobsByOwner(ownerKey: string, limitCount: number): Promise<RenderJobRecord[]> {
  if (adminDb) {
    const snapshot = await adminDb
      .collection(COLLECTION_NAME)
      .where("ownerKey", "==", ownerKey)
      .orderBy("createdAt", "desc")
      .limit(limitCount)
      .get();

    return snapshot.docs.map((doc) => fromUnknownRecord(doc.id, doc.data()));
  }

  return Array.from(memoryJobs.values())
    .filter((job) => job.ownerKey === ownerKey)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, limitCount);
}

async function claimNextJobFromFirestore(workerId?: string): Promise<RenderJobRecord | null> {
  if (!adminDb) return null;

  const snapshot = await adminDb.collection(COLLECTION_NAME).orderBy("createdAt", "asc").limit(30).get();
  if (snapshot.empty) return null;

  for (const doc of snapshot.docs) {
    let claimed: RenderJobRecord | null = null;
    const docRef = doc.ref;

    await adminDb.runTransaction(async (transaction) => {
      const fresh = await transaction.get(docRef);
      if (!fresh.exists) return;
      const data = fresh.data();
      if (!data) return;

      const record = fromUnknownRecord(fresh.id, data);
      if (record.status !== "queued") return;

      const timestamp = nowIso();
      const workerSuffix = workerId ? ` (${workerId})` : "";

      claimed = {
        ...record,
        status: "running",
        updatedAt: timestamp,
        claimedAt: timestamp,
        claimedBy: workerId,
        error: undefined,
        logs: mergeLogs(record.logs, [`任务已被 ManimBox worker 领取${workerSuffix}。`]),
      };

      const payload = stripUndefinedDeep(claimed) as Record<string, unknown>;
      transaction.set(docRef, payload, { merge: true });
    });

    if (claimed) {
      return claimed;
    }
  }

  return null;
}

function claimNextJobFromMemory(workerId?: string): RenderJobRecord | null {
  const queued = Array.from(memoryJobs.values())
    .filter((item) => item.status === "queued")
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

  if (queued.length === 0) return null;
  const first = queued[0];
  const timestamp = nowIso();
  const workerSuffix = workerId ? ` (${workerId})` : "";

  const claimed: RenderJobRecord = {
    ...first,
    status: "running",
    updatedAt: timestamp,
    claimedAt: timestamp,
    claimedBy: workerId,
    error: undefined,
    logs: mergeLogs(first.logs, [`任务已被 ManimBox worker 领取${workerSuffix}。`]),
  };

  memoryJobs.set(claimed.id, claimed);
  return claimed;
}

async function cancelQueuedJobInFirestore(id: string, ownerKey: string): Promise<CancelQueuedRenderJobResult> {
  if (!adminDb) return { status: "not_found" };

  const docRef = adminDb.collection(COLLECTION_NAME).doc(id);
  let next: RenderJobRecord | null = null;
  let status: CancelQueuedRenderJobResult["status"] = "not_found";

  await adminDb.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(docRef);
    if (!snapshot.exists) {
      status = "not_found";
      return;
    }

    const raw = snapshot.data();
    if (!raw) {
      status = "not_found";
      return;
    }

    const current = fromUnknownRecord(snapshot.id, raw);
    if (current.ownerKey !== ownerKey) {
      status = "not_found";
      return;
    }

    if (current.status !== "queued") {
      status = "not_queued";
      return;
    }

    next = {
      ...current,
      status: "failed",
      error: "任务已取消",
      updatedAt: nowIso(),
      logs: mergeLogs(current.logs, ["任务已取消。"]),
    };
    status = "cancelled";

    const payload = stripUndefinedDeep(next) as Record<string, unknown>;
    transaction.set(docRef, payload, { merge: true });
  });

  if (status === "cancelled" && next) {
    return { status, job: toPublicJob(next) };
  }
  return { status };
}

function cancelQueuedJobInMemory(id: string, ownerKey: string): CancelQueuedRenderJobResult {
  const current = memoryJobs.get(id);
  if (!current || current.ownerKey !== ownerKey) {
    return { status: "not_found" };
  }

  if (current.status !== "queued") {
    return { status: "not_queued" };
  }

  const next: RenderJobRecord = {
    ...current,
    status: "failed",
    error: "任务已取消",
    updatedAt: nowIso(),
    logs: mergeLogs(current.logs, ["任务已取消。"]),
  };

  memoryJobs.set(id, next);
  return { status: "cancelled", job: toPublicJob(next) };
}

export async function createRenderJob(input: {
  ownerKey: string;
  code: string;
  quality: RenderQuality;
  title?: string;
}): Promise<RenderJob> {
  const id = crypto.randomUUID();
  const timestamp = nowIso();
  const title = input.title?.trim() || `Scene-${id.slice(0, 6)}`;

  const record: RenderJobRecord = {
    id,
    ownerKey: input.ownerKey,
    code: input.code,
    title,
    quality: input.quality,
    status: "queued",
    codeLength: input.code.length,
    logs: ["任务已创建，等待 ManimBox worker 领取。"],
    createdAt: timestamp,
    updatedAt: timestamp,
    executionMode: "worker-pull",
  };

  await saveJob(record);
  return toPublicJob(record);
}

export async function getRenderJobForOwner(id: string, ownerKey: string): Promise<RenderJob | null> {
  const record = await getJobById(id);
  if (!record || record.ownerKey !== ownerKey) return null;
  return toPublicJob(record);
}

export async function listRenderJobsForOwner(ownerKey: string, limitCount = 10): Promise<RenderJob[]> {
  const records = await listJobsByOwner(ownerKey, limitCount);
  return records
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .map((record) => toPublicJob(record));
}

export async function cancelQueuedRenderJobForOwner(id: string, ownerKey: string): Promise<CancelQueuedRenderJobResult> {
  const result = adminDb ? await cancelQueuedJobInFirestore(id, ownerKey) : cancelQueuedJobInMemory(id, ownerKey);

  if (result.status === "cancelled") {
    logServerEvent("info", "render_job_cancelled", {
      jobId: result.job.id,
      ownerKey,
    });
  }

  return result;
}

export async function claimNextRenderJob(workerId?: string): Promise<WorkerRenderJob | null> {
  const claimed = adminDb ? await claimNextJobFromFirestore(workerId) : claimNextJobFromMemory(workerId);
  if (!claimed) return null;

  logServerEvent("info", "render_job_claimed", {
    jobId: claimed.id,
    workerId: workerId ?? "unknown",
    quality: claimed.quality,
  });

  return toWorkerJob(claimed);
}

export async function updateRenderJobFromWorker(input: {
  jobId: string;
  status: RenderJobStatus;
  workerId?: string;
  logs?: string[];
  error?: string;
  output?: RenderOutput;
}): Promise<RenderJob | null> {
  const record = await getJobById(input.jobId);
  if (!record) return null;

  if (record.claimedBy && input.workerId && record.claimedBy !== input.workerId) {
    throw new Error(`Worker mismatch for job ${record.id}. Claimed by ${record.claimedBy}, got ${input.workerId}.`);
  }

  if ((record.status === "succeeded" || record.status === "failed") && input.status === "running") {
    return toPublicJob(record);
  }

  const statusLog =
    input.status === "succeeded"
      ? "渲染完成，结果已回传。"
      : input.status === "failed"
        ? `渲染失败：${input.error?.trim() || "unknown_error"}`
        : input.status === "running"
          ? "渲染节点正在执行 Manim..."
          : "";

  const nextLogs = mergeLogs(record.logs, [...(input.logs ?? []), statusLog].filter(Boolean));

  const next: RenderJobRecord = {
    ...record,
    status: input.status,
    updatedAt: nowIso(),
    logs: nextLogs,
    output: input.status === "succeeded" ? input.output ?? record.output : undefined,
    error: input.status === "failed" ? input.error?.trim() || "Manim 渲染失败" : undefined,
    claimedBy: record.claimedBy ?? input.workerId,
    claimedAt: record.claimedAt ?? (input.status === "running" ? nowIso() : record.claimedAt),
  };

  await saveJob(next);

  logServerEvent(input.status === "failed" ? "warn" : "info", "render_job_updated_by_worker", {
    jobId: next.id,
    status: next.status,
    hasOutput: Boolean(next.output),
  });

  return toPublicJob(next);
}
