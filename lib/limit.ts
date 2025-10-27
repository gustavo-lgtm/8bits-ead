// lib/limit.ts
export interface RateLimitError extends Error {
  status: number;
  retryAfter?: number;
}

type Bucket = {
  tokens: number;
  lastRefill: number; // epoch ms
};

type LimitOptions = {
  /** Chave do balde. Ex.: "ip:1.2.3.4|path:/api/auth/forgot" */
  key: string;
  /** Capacidade máxima de requisições na janela. */
  capacity?: number;
  /** Duração (ms) da janela para "refill" total. Ex.: 10 min = 600_000 */
  windowMs?: number;
};

const BUCKETS: Map<string, Bucket> = new Map();

/**
 * Limita requisições por chave com janela deslizante.
 * - capacity: requisições permitidas por janela
 * - windowMs: duração da janela
 *
 * Uso:
 *   await limitOrThrow({ key: `ip:${ip}|path:/api/auth/forgot`, capacity: 5, windowMs: 10*60_000 })
 */
export async function limitOrThrow(opts: LimitOptions) {
  const capacity = opts.capacity ?? 10;          // 10 reqs
  const windowMs = opts.windowMs ?? 10 * 60_000; // 10 minutos

  const now = Date.now();
  const key = opts.key;

  let bucket = BUCKETS.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    BUCKETS.set(key, bucket);
  }

  // Refill proporcional ao tempo passado (janela deslizante)
  const elapsed = now - bucket.lastRefill;
  if (elapsed > 0) {
    const refill = (elapsed / windowMs) * capacity;
    bucket.tokens = Math.min(capacity, bucket.tokens + refill);
    bucket.lastRefill = now;
  }

  if (bucket.tokens < 1) {
    const err: RateLimitError = new Error("Too Many Requests") as RateLimitError;
    err.status = 429;
    err.retryAfter = Math.ceil(windowMs / 1000);
    throw err;
  }

  bucket.tokens -= 1;
  BUCKETS.set(key, bucket);
}

/** Helper para extrair IP de Request (Next.js App Router) */
export function getClientIp(req: Request): string {
  try {
    const fwd = req.headers.get("x-forwarded-for") || "";
    if (fwd) {
      const ip = fwd.split(",")[0].trim();
      if (ip) return ip;
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;
  } catch {
    // ignore
  }
  return "0.0.0.0";
}
