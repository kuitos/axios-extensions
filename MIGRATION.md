# Migration Guide (v3 → v4)

This document explains how to migrate from **axios-extensions v3** to the current **v4** API.

## TL;DR

1. Upgrade runtime dependencies:
	- `node >= 18`
	- `axios >= 1.0.0`
2. Update cache enhancer configuration:
	- replace `enabledByDefault` + `cacheFlag` with `cacheable`
3. Review any custom non-GET caching strategy:
	- ensure `keyGenerator` includes method/body semantics when needed

## Breaking Changes

### 1) Runtime baseline updated

- **Node.js**: now `>= 18`
- **axios**: now `>= 1.0.0`

If your app is still on older Node or Axios major versions, upgrade those first.

### 2) Cache options were consolidated

In v3, cache behavior was controlled by multiple knobs (`enabledByDefault`, `cacheFlag`, plus method checks).

In v4, this is unified into one predicate:

```ts
cacheable?: (config: AxiosRequestConfig) => boolean | ICacheLike<any>
```

Removed options:

- `enabledByDefault`
- `cacheFlag`

Unchanged defaults in v4:

- GET requests are cacheable by default
- `cache: false` disables caching per request
- `cache: <CacheLike>` uses a custom cache instance

### 3) `Cache` export is no longer `lru-cache`

In v3, `Cache` effectively came from `lru-cache`.

In v4, `Cache` is a library-owned wrapper built on `tiny-lru`.

If your app relied on `lru-cache`-specific APIs, migrate to the cache-like contract used by enhancers:

- `get(key)`
- `set(key, value)`
- `delete(key)` (or legacy `del(key)`)

The exported `Cache` class also provides `clear()`, but enhancer integration does not require it.

## Migration Recipes

### A) No custom cache options (most users)

No change needed:

```ts
// v3
cacheAdapterEnhancer(adapter);

// v4
cacheAdapterEnhancer(adapter);
```

### B) `enabledByDefault: false` (opt-in caching)

```ts
// v3
cacheAdapterEnhancer(adapter, { enabledByDefault: false });

// v4
cacheAdapterEnhancer(adapter, {
	cacheable: config => config.method === 'get' ? (config.cache ?? false) : false,
});
```

### C) `enabledByDefault: false` + custom `cacheFlag`

```js
// v3
cacheAdapterEnhancer(adapter, {
	enabledByDefault: false,
	cacheFlag: 'useCache',
});
// usage: http.get('/users', { useCache: true })

// v4
cacheAdapterEnhancer(adapter, {
	cacheable: config => config.method === 'get' ? (config.useCache ?? false) : false,
});
// usage unchanged: http.get('/users', { useCache: true })
```

### D) Custom `cacheFlag` with default-enabled cache

```js
// v3
cacheAdapterEnhancer(adapter, { cacheFlag: 'useCache' });
// usage: http.get('/users', { useCache: false }) // opt out

// v4
cacheAdapterEnhancer(adapter, {
	cacheable: config => {
		if (config.method !== 'get') return false;
		if (config.useCache !== undefined) return config.useCache;
		return true;
	},
});
```

If you use TypeScript and custom flags like `useCache`, augment `AxiosRequestConfig` in your app:

```ts
import type { ICacheLike } from 'axios-extensions';

declare module 'axios' {
	interface AxiosRequestConfig {
		useCache?: boolean | ICacheLike<any>;
	}
}
```

### E) Cache non-GET requests

Use `cacheable` and a method-aware key:

```ts
cacheAdapterEnhancer(adapter, {
	cacheable: config => config.method === 'get' || config.method === 'post',
	keyGenerator: config => `${config.method}:${config.url}`,
});
```

> For body-sensitive POST caching, include request body in your key strategy.

## New/Important v4 Behaviors to Consider

- `threshold` can be overridden per request in `throttleAdapterEnhancer`:

```ts
http.get('/users', { threshold: 3000 });
```

- Retry still supports per-request `retryTimes` override:

```ts
http.get('/critical', { retryTimes: 3 });
```

- Cache hits add `response.__fromCache = true`.

## Verification Checklist

After migration, validate these points:

- [ ] GET requests are cached as expected
- [ ] `cache: false` correctly bypasses cache
- [ ] Custom `cacheable` logic matches your previous v3 behavior
- [ ] Non-GET caching (if enabled) uses a collision-safe key
- [ ] Per-request `retryTimes` and `threshold` overrides behave as intended
- [ ] Any direct `Cache` usage does not depend on `lru-cache`-specific methods

## Why v4 made this change

v3 spread cache policy across multiple options. v4 aligns the API to three explicit concerns:

- **Whether to cache** → `cacheable`
- **How to build cache key** → `keyGenerator`
- **Where to store cache** → `defaultCache`

That makes advanced policies (URL-based, method-based, opt-in, custom store) easier to express and reason about.
