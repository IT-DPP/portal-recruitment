/**
 * Lightweight in-memory rate limiter for protecting authentication endpoints
 * against brute-force / credential stuffing when MFA is not enabled.
 */

interface RateLimitBucket {
  failures: number;
  firstFailureAt: number;
  blockedUntil: number;
}

const buckets = new Map<string, RateLimitBucket>();

export const DEFAULT_MAX_FAILURES = 5;
export const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const DEFAULT_BLOCK_MS = 15 * 60 * 1000; // 15 minutes

export function checkLoginRateLimit(
  identifier: string,
  now = Date.now(),
  maxFailures = DEFAULT_MAX_FAILURES,
  windowMs = DEFAULT_WINDOW_MS
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const key = identifier.trim().toLowerCase();
  const bucket = buckets.get(key);

  if (!bucket) {
    return { allowed: true };
  }

  if (bucket.blockedUntil > now) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.blockedUntil - now) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  if (now - bucket.firstFailureAt > windowMs) {
    buckets.delete(key);
    return { allowed: true };
  }

  if (bucket.failures >= maxFailures) {
    bucket.blockedUntil = now + DEFAULT_BLOCK_MS;
    const retryAfterSeconds = Math.max(1, Math.ceil(DEFAULT_BLOCK_MS / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

export function recordLoginFailure(
  identifier: string,
  now = Date.now(),
  maxFailures = DEFAULT_MAX_FAILURES,
  windowMs = DEFAULT_WINDOW_MS,
  blockMs = DEFAULT_BLOCK_MS
): { blocked: boolean; remainingAttempts: number } {
  const key = identifier.trim().toLowerCase();
  const existing = buckets.get(key);

  if (!existing || now - existing.firstFailureAt > windowMs) {
    buckets.set(key, {
      failures: 1,
      firstFailureAt: now,
      blockedUntil: 0,
    });
    return { blocked: false, remainingAttempts: Math.max(0, maxFailures - 1) };
  }

  existing.failures += 1;
  if (existing.failures >= maxFailures) {
    existing.blockedUntil = now + blockMs;
    return { blocked: true, remainingAttempts: 0 };
  }

  return {
    blocked: false,
    remainingAttempts: Math.max(0, maxFailures - existing.failures),
  };
}

export function resetLoginRateLimit(identifier: string): void {
  const key = identifier.trim().toLowerCase();
  buckets.delete(key);
}

