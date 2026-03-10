import { NextResponse } from "next/server";
import { adminStorage } from "@/lib/firebase/admin";

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

  if (!adminStorage) {
    return NextResponse.json({ error: "Firebase Storage is not initialized." }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const jobId = formData.get("jobId") as string | null;

    if (!file || !jobId) {
      return NextResponse.json({ error: "Missing file or jobId in form data." }, { status: 400 });
    }

    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    if (!bucketName) {
        return NextResponse.json({ error: "FIREBASE_STORAGE_BUCKET is not configured." }, { status: 500 });
    }

    const bucket = adminStorage.bucket(bucketName);
    const blobName = `videos/${jobId}.mp4`;
    const blob = bucket.file(blobName);

    const buffer = Buffer.from(await file.arrayBuffer());
    
    await blob.save(buffer, {
      contentType: "video/mp4",
      public: true, // Make it publicly accessible
      metadata: {
        workerId,
        jobId,
      }
    });

    // The public URL for Firebase Storage
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${blobName}`;

    return NextResponse.json({
      ok: true,
      videoUrl: publicUrl,
    });
  } catch (error) {
    console.error("[upload-api] error:", error);
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
