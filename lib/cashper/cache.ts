type CacheEntry<T> = { expiresAt: number; value: T };

const localCache = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();
type EdgeCacheStorage = CacheStorage & { default?: Cache };

function edgeRequest(key: string) {
  return new Request(`https://cashper-cache.invalid/v1/${encodeURIComponent(key)}`);
}

export async function cached<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const local = localCache.get(key) as CacheEntry<T> | undefined;
  if (local && local.expiresAt > now) return local.value;

  const edge = (globalThis.caches as EdgeCacheStorage | undefined)?.default;
  if (edge) {
    try {
      const response = await edge.match(edgeRequest(key));
      if (response) {
        const value = await response.json() as T;
        localCache.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
        return value;
      }
    } catch { /* Local development continues with the bounded memory cache. */ }
  }

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const request = fetcher()
    .then((value) => {
      if (localCache.size > 250) localCache.delete(localCache.keys().next().value as string);
      localCache.set(key, { value, expiresAt: now + ttlSeconds * 1000 });
      if (edge) {
        void edge.put(edgeRequest(key), new Response(JSON.stringify(value), {
          headers: { 'cache-control': `max-age=${ttlSeconds}`, 'content-type': 'application/json' },
        })).catch(() => undefined);
      }
      return value;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, request);
  return request;
}
