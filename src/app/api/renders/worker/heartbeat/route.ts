import { NextResponse } from "next/server";

import { workerHeartbeatRequestSchema } from "@/contracts/renders";
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

  const bodyResult = await readJsonBody<unknown>(request);
  if (!bodyResult.ok) {
    return NextResponse.json({ error: bodyResult.error }, { status: 400 });
  }

  const validated = validateBody(workerHeartbeatRequestSchema, bodyResult.data);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const result = await upsertRenderWorkerHeartbeat(validated.data);
  return NextResponse.json({
    ok: true,
    worker: result,
  });
}
