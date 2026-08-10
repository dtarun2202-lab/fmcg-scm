import { Request, Response, NextFunction } from "express";

/**
 * Token bucket rate limiter, keyed per client (IP here - swap for API key
 * or user id in production). Each bucket refills at `refillRatePerSec`
 * tokens/sec up to `capacity`. Smoother than a fixed window counter because
 * it allows short bursts without permanently blocking a client at the
 * window boundary.
 */
class TokenBucket {
  private tokens: number;
  private lastRefill: number;

  constructor(private capacity: number, private refillRatePerSec: number) {
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  tryConsume(cost = 1): boolean {
    this.refill();
    if (this.tokens >= cost) {
      this.tokens -= cost;
      return true;
    }
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSec = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.refillRatePerSec);
    this.lastRefill = now;
  }
}

const buckets = new Map<string, TokenBucket>();

export function rateLimiter(capacity = 20, refillRatePerSec = 5) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip ?? "unknown";
    if (!buckets.has(key)) buckets.set(key, new TokenBucket(capacity, refillRatePerSec));

    const bucket = buckets.get(key)!;
    if (!bucket.tryConsume()) {
      return res.status(429).json({ error: "Too many requests, slow down." });
    }
    next();
  };
}
