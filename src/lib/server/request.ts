export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const [firstIp] = forwarded.split(",");
    return firstIp.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

type ReadJsonResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function readJsonBody<T>(request: Request): Promise<ReadJsonResult<T>> {
  try {
    const data = (await request.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: "请求体必须是合法 JSON" };
  }
}

