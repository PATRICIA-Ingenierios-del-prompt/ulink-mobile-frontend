/**
 * SimpleCache — in-memory TTL cache for API responses.
 * 
 * Prevents redundant network calls when switching between tabs.
 * Each entry expires after its own TTL (default: 60 s).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class SimpleCache {
  private store = new Map<string, CacheEntry<unknown>>();

  /** Read a cached value. Returns undefined if missing or expired. */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  /** Write a value with a TTL in milliseconds. */
  set<T>(key: string, data: T, ttlMs = 60_000): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  /** Remove a specific key (e.g. after a mutation). */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Remove all keys that start with a prefix (e.g. "parches"). */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Clear everything. */
  clear(): void {
    this.store.clear();
  }
}

export const cache = new SimpleCache();

/**
 * Convenience wrapper: return cached value if fresh, otherwise
 * call fetcher(), cache its result, and return it.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs = 60_000
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) return cached;

  const data = await fetcher();
  cache.set(key, data, ttlMs);
  return data;
}
