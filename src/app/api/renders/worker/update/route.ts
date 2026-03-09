import { NextResponse } from "next/server";

import { workerUpdateRequestSchema } from "@/contracts/renders";
import { updateRenderJobFromWorker } from "@/lib/server/render-jobs";
import { upsertRenderWorkerHeartbeat } from "@/lib/server/render-workers";
import { readJsonBody } from "@/lib/server/request";
import { validateBody } from "@/lib/server/validation";

function hasValidWorkerToken(request: Request): boolean {
  const expected = process.env.MANIMBOX_WORKER_TOKEN?.trim();
  const provided = request.headers.get("x-render-worker-token")?.trim();

  if (!expected) return false;
  if (!provided) return false;
  return expected === provided;
}

export async function POST(request: Request) {
  if (!process.env.MANIMBOX_WORKER_TOKEN?.trim()) {
    return NextResponse.json({ error: "MANIMBOX_WORKER_TOKEN is not configured." }, { status: 500 });
  }

  if (!hasValidWorkerToken(request)) {
    return NextResponse.json({ error: "Unauthorized worker request." }, { status: 401 });
  }

  const workerId = request.headers.get("x-worker-id")?.trim();
  if (!workerId) {
    return NextResponse.json({ error: "Missing required x-worker-id header." }, { status: 400 });
  }

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(workerUpdateRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  let updatedJob;
  try {
    updatedJob = await updateRenderJobFromWorker({
      ...validated.data,
      workerId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Worker update failed.";
    return NextResponse.json({ error: message }, { status: 409 });
  }

  if (!updatedJob) {
    return NextResponse.json({ error: "Render job not found." }, { status: 404 });
  }

  await upsertRenderWorkerHeartbeat({
    workerId,
    status: validated.data.status === "running" ? "busy" : "idle",
    activeJobId: validated.data.status === "running" ? validated.data.jobId : undefined,
  });

  return NextResponse.json({
    ok: true,
    job: updatedJob,
  });
}
