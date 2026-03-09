import { adminDb } from "@/lib/firebase/admin";

type WorkerStatus = "idle" | "busy" | "offline";

type WorkerDetails = Record<string, string | number | boolean>;

type RenderWorkerRecord = {
  workerId: string;
  status: WorkerStatus;
  activeJobId?: string;
  lastSeenAt: string;
  updatedAt: string;
  details?: WorkerDetails;
};

const COLLECTION_NAME = "renderWorkers";
const memoryWorkers = new Map<string, RenderWorkerRecord>();

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

export async function upsertRenderWorkerHeartbeat(input: {
  workerId: string;
  status: WorkerStatus;
  activeJobId?: string;
  details?: WorkerDetails;
}): Promise<RenderWorkerRecord> {
  const timestamp = nowIso();
  const record: RenderWorkerRecord = {
    workerId: input.workerId,
    status: input.status,
    activeJobId: input.activeJobId,
    details: input.details,
    lastSeenAt: timestamp,
    updatedAt: timestamp,
  };

  if (adminDb) {
    const payload = stripUndefinedDeep(record) as Record<string, unknown>;
    await adminDb.collection(COLLECTION_NAME).doc(record.workerId).set(payload, { merge: true });
    return record;
  }

  memoryWorkers.set(record.workerId, record);
  return record;
}
