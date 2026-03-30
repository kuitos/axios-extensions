# Migration Guide

## `cacheAdapterEnhancer` options consolidation (v4.1)

v4.1 consolidates three cache options (`enabledByDefault`, `cacheFlag`, and the hardcoded `method === 'get'` check) into a single `cacheable` predicate.

**Options removed:**
- `enabledByDefault`
- `cacheFlag`

**Option added:**
- `cacheable: (config: AxiosRequestConfig) => boolean | ICacheLike`

The default behavior is **unchanged** — GET requests are cached automatically, `cache: false` opts out per-request, and `cache: <CacheLike>` uses a custom store.

### Migration recipes

#### Default usage (no changes needed)

```js
// before
cacheAdapterEnhancer(adapter)

// after — identical, default cacheable handles everything
cacheAdapterEnhancer(adapter)
```

#### `enabledByDefault: false`

```js
// before
cacheAdapterEnhancer(adapter, { enabledByDefault: false })

// after
cacheAdapterEnhancer(adapter, {
  cacheable: (config) => config.cache ?? false,
})
```

#### `enabledByDefault: false` with `cacheFlag: 'useCache'`

```js
// before
cacheAdapterEnhancer(adapter, { enabledByDefault: false, cacheFlag: 'useCache' })
// usage: http.get('/users', { useCache: true })

// after
cacheAdapterEnhancer(adapter, {
  cacheable: (config) => config.useCache ?? false,
})
// usage stays the same: http.get('/users', { useCache: true })
```

#### Custom `cacheFlag` with default enabled

```js
// before
cacheAdapterEnhancer(adapter, { cacheFlag: 'useCache' })
// usage: http.get('/users', { useCache: false }) to opt out

// after
cacheAdapterEnhancer(adapter, {
  cacheable: (config) => {
    if (config.useCache !== undefined) return config.useCache;
    return config.method === 'get';
  },
})
```

#### Cache POST requests (new)

```js
// before — not possible

// after
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
