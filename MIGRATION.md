# Migration Guide

## Migrating to v5.x from v4.x

### Breaking change: `cacheAdapterEnhancer` options

v5 consolidates three cache options (`enabledByDefault`, `cacheFlag`, and the hardcoded `method === 'get'` check) into a single `cacheable` predicate.

**Options removed:**
- `enabledByDefault`
- `cacheFlag`

**Option added:**
- `cacheable: (config: AxiosRequestConfig) => boolean | ICacheLike`

The default behavior is **unchanged** — GET requests are cached automatically, `cache: false` opts out per-request, and `cache: <CacheLike>` uses a custom store.

### Migration recipes

#### Default usage (no changes needed)

```js
// v4
cacheAdapterEnhancer(adapter)

// v5 — identical, default cacheable handles everything
cacheAdapterEnhancer(adapter)
```

#### `enabledByDefault: false`

```js
// v4
cacheAdapterEnhancer(adapter, { enabledByDefault: false })

// v5
cacheAdapterEnhancer(adapter, {
  cacheable: (config) => config.cache ?? false,
})
```

#### `enabledByDefault: false` with `cacheFlag: 'useCache'`

```js
// v4
cacheAdapterEnhancer(adapter, { enabledByDefault: false, cacheFlag: 'useCache' })
// usage: http.get('/users', { useCache: true })

// v5
cacheAdapterEnhancer(adapter, {
  cacheable: (config) => config.useCache ?? false,
})
// usage stays the same: http.get('/users', { useCache: true })
```

#### Custom `cacheFlag` with default enabled

```js
// v4
cacheAdapterEnhancer(adapter, { cacheFlag: 'useCache' })
// usage: http.get('/users', { useCache: false }) to opt out

// v5
cacheAdapterEnhancer(adapter, {
  cacheable: (config) => {
    if (config.useCache !== undefined) return config.useCache;
    return config.method === 'get';
  },
})
```

#### Cache POST requests (new in v5)

```js
// v4 — not possible

// v5
cacheAdapterEnhancer(adapter, {
  cacheable: (config) => config.method === 'get' || config.method === 'post',
  keyGenerator: (config) => `${config.method}:${config.url}`,
})
```

### Why this change?

The previous API split "whether to cache" across three separate knobs. From first principles, caching has three concerns — **whether to cache**, **cache key**, and **cache store**. The new API maps options 1:1 to these concerns:

```
Before (5 options):                After (3 options):
  enabledByDefault  ─┐
  cacheFlag         ─┼→  cacheable
  method === 'get'  ─┘
  keyGenerator      ───→  keyGenerator
  defaultCache      ───→  defaultCache
```

The `cacheable` predicate receives the full `AxiosRequestConfig`, giving you complete control to implement any caching strategy — including POST caching, conditional caching based on URL patterns, or custom opt-in flags.
