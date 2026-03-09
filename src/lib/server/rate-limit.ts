type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  max: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 50_000;

function pruneBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return;

  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export function checkRateLimit({ key, max, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  pruneBuckets(now);

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: max - 1,
      resetAt,
      retryAfterSec: Math.ceil(windowMs / 1000),
    };
  }

  current.count += 1;
  buckets.set(key, current);

  const allowed = current.count <= max;
  const remaining = Math.max(max - current.count, 0);
  const retryAfterSec = Math.max(Math.ceil((current.resetAt - now) / 1000), 1);

  return {
    allowed,
    remaining,
    resetAt: current.resetAt,
    retryAfterSec,
  };
}

export function getRateLimitHeaders(result: RateLimitResult, max: number): HeadersInit {
  return {
    "X-RateLimit-Limit": String(max),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
    "Retry-After": String(result.retryAfterSec),
  };
}

export function resetRateLimitStoreForTests() {
  if (process.env.NODE_ENV !== "test") return;
  buckets.clear();
}
