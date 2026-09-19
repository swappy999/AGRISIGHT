// ── In-Memory Request Deduplication & Data Cache ────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightRequests = new Map<string, Promise<any>>();

/**
 * Executes a fetcher function with automatic request deduplication and in-memory TTL caching.
 * Simultaneous calls with the same key reuse the same in-flight promise.
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = 15000,
  forceRefresh: boolean = false
): Promise<T> {
  const now = Date.now();

  // 1. Return fresh cached data if available and not forced
  if (!forceRefresh) {
    const cached = memoryCache.get(key);
    if (cached && now - cached.timestamp < cached.ttlMs) {
      return cached.data as T;
    }
  }

  // 2. Reuse in-flight promise if an identical request is already running
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key) as Promise<T>;
  }

  // 3. Execute request and store promise
  const promise = (async () => {
    try {
      const data = await fetcher();
      memoryCache.set(key, {
        data,
        timestamp: Date.now(),
        ttlMs,
      });
      return data;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
}

/**
 * Invalidate specific cache keys or key prefixes (e.g. invalidateCache("analyses"))
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix) || key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
}
