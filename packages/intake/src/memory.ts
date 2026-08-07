export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

export interface RateLimiter {
  consume(key: string, now: number): Promise<RateLimitResult>;
}

export interface DuplicateStore {
  claim(fingerprint: string, now: number): Promise<boolean>;
  release(fingerprint: string): Promise<void>;
}

type RateEntry = { count: number; resetsAt: number };

export class MemoryRateLimiter implements RateLimiter {
  private readonly entries = new Map<string, RateEntry>();

  constructor(
    private readonly limit = 5,
    private readonly windowMs = 60_000,
    private readonly maximumEntries = 10_000,
  ) {
    if (
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      !Number.isSafeInteger(windowMs) ||
      windowMs < 1 ||
      !Number.isSafeInteger(maximumEntries) ||
      maximumEntries < 1
    ) {
      throw new Error("MemoryRateLimiter requires positive integer limits");
    }
  }

  async consume(key: string, now: number): Promise<RateLimitResult> {
    this.prune(now);
    const current = this.entries.get(key);

    if (!current || current.resetsAt <= now) {
      this.ensureCapacity();
      this.entries.set(key, { count: 1, resetsAt: now + this.windowMs });
      return { allowed: true };
    }

    if (current.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((current.resetsAt - now) / 1_000),
        ),
      };
    }

    current.count += 1;
    return { allowed: true };
  }

  private prune(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.resetsAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  private ensureCapacity(): void {
    if (this.entries.size < this.maximumEntries) {
      return;
    }
    const oldestKey = this.entries.keys().next().value as string | undefined;
    if (oldestKey) {
      this.entries.delete(oldestKey);
    }
  }
}

type DuplicateEntry = { expiresAt: number };

export class MemoryDuplicateStore implements DuplicateStore {
  private readonly entries = new Map<string, DuplicateEntry>();

  constructor(
    private readonly ttlMs = 5 * 60_000,
    private readonly maximumEntries = 10_000,
  ) {
    if (
      !Number.isSafeInteger(ttlMs) ||
      ttlMs < 1 ||
      !Number.isSafeInteger(maximumEntries) ||
      maximumEntries < 1
    ) {
      throw new Error("MemoryDuplicateStore requires positive integer limits");
    }
  }

  async claim(fingerprint: string, now: number): Promise<boolean> {
    this.prune(now);
    const existing = this.entries.get(fingerprint);
    if (existing && existing.expiresAt > now) {
      return false;
    }

    this.ensureCapacity();
    this.entries.set(fingerprint, { expiresAt: now + this.ttlMs });
    return true;
  }

  async release(fingerprint: string): Promise<void> {
    this.entries.delete(fingerprint);
  }

  private prune(now: number): void {
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= now) {
        this.entries.delete(key);
      }
    }
  }

  private ensureCapacity(): void {
    if (this.entries.size < this.maximumEntries) {
      return;
    }
    const oldestKey = this.entries.keys().next().value as string | undefined;
    if (oldestKey) {
      this.entries.delete(oldestKey);
    }
  }
}
