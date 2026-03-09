import { adminDb } from "@/lib/firebase/admin";
import { communityAnimations, getAnimationBySlug, type AnimationItem } from "@/lib/data/animg";

export type AnimationCard = {
  id: string;
  slug: string;
  title: string;
  duration: string;
  summary: string;
  tags: string[];
  createdAt: string;
  author: string;
  thumbnailUrl: string;
};

function normalizeDuration(durationSec: number | null | undefined, fallback = "0:00") {
  if (!durationSec || !Number.isFinite(durationSec) || durationSec <= 0) return fallback;
  const minute = Math.floor(durationSec / 60);
  const sec = Math.round(durationSec % 60)
    .toString()
    .padStart(2, "0");
  return `${minute}:${sec}`;
}

function formatCreatedAt(value: string) {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(parsed));
}

function fallbackThumbnailDataUrl(title: string) {
  const safeTitle = title.replace(/[<>&"]/g, "");
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1280' height='720'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='#1d4ed8'/><stop offset='55%' stop-color='#4338ca'/><stop offset='100%' stop-color='#0891b2'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='60' y='360' fill='white' font-size='48' font-family='Arial, Helvetica, sans-serif'>${safeTitle}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function toAnimationCardFromItem(item: AnimationItem): AnimationCard {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    duration: item.duration,
    summary: item.description,
    tags: item.tags,
    createdAt: item.createdAt,
    author: item.author,
    thumbnailUrl: item.thumbnailUrl,
  };
}

function toAnimationItemFromDoc(id: string, data: Record<string, unknown>): AnimationItem {
  const title = String(data.title ?? "Untitled");
  const createdAtRaw = String(data.createdAt ?? new Date().toISOString());
  const output = data.output && typeof data.output === "object" ? (data.output as Record<string, unknown>) : undefined;
  const outputDuration = output ? Number(output.durationSec ?? 0) : 0;
  const outputPreview = output ? String(output.previewText ?? "") : "";

  const durationRaw = String(data.duration ?? "").trim();
  const duration = durationRaw || normalizeDuration(outputDuration, "0:00");
  const description = String(data.description ?? data.summary ?? outputPreview ?? "").trim();
  const specMarkdown = String(data.specMarkdown ?? `## ${title}\n\n${description || "Shared from creator thread."}`);

  const slug = String(data.slug ?? id);
  const videoUrl = String(data.videoUrl ?? "");
  const thumbnailUrl = String(data.thumbnailUrl ?? fallbackThumbnailDataUrl(title));

  return {
    id,
    slug,
    title,
    description: description || "Shared from creator thread.",
    tags: Array.isArray(data.tags) ? data.tags.map((item) => String(item)) : ["creator", "thread-share"],
    duration,
    createdAt: formatCreatedAt(createdAtRaw),
    author: String(data.authorName ?? data.author ?? "AnimG User"),
    aiModel: String(data.aiModel ?? process.env.DEEPSEEK_MODEL ?? "deepseek-chat"),
    status: "Completed",
    thumbnailUrl,
    videoUrl,
    specMarkdown,
    code: String(data.code ?? ""),
  };
}

export async function getFeaturedAnimations(): Promise<AnimationCard[]> {
  if (!adminDb) {
    return communityAnimations.map((item) => toAnimationCardFromItem(item));
  }

  const snapshot = await adminDb.collection("animations").orderBy("createdAt", "desc").limit(24).get();
  if (snapshot.empty) {
    return communityAnimations.map((item) => toAnimationCardFromItem(item));
  }

  return snapshot.docs.map((doc) => toAnimationCardFromItem(toAnimationItemFromDoc(doc.id, doc.data())));
}

export async function getAnimationDetailBySlug(slug: string): Promise<AnimationItem | null> {
  if (adminDb) {
    const snapshot = await adminDb.collection("animations").where("slug", "==", slug).limit(1).get();
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return toAnimationItemFromDoc(doc.id, doc.data());
    }
  }

  return getAnimationBySlug(slug) ?? null;
}
