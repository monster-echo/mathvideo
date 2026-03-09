import { NextResponse } from "next/server";

import { claimNextRenderJob } from "@/lib/server/render-jobs";
import { upsertRenderWorkerHeartbeat } from "@/lib/server/render-workers";

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

  const job = await claimNextRenderJob(workerId);
  await upsertRenderWorkerHeartbeat({
    workerId,
    status: job ? "busy" : "idle",
    activeJobId: job?.id,
  });

  return NextResponse.json({
    ok: true,
    job,
  });
}
