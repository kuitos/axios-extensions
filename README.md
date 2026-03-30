<div align="center">

# axios-extensions

[![npm version](https://img.shields.io/npm/v/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)
[![build](https://img.shields.io/github/actions/workflow/status/kuitos/axios-extensions/ci.yml?branch=master&style=flat-square)](https://github.com/kuitos/axios-extensions/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/kuitos/axios-extensions.svg?style=flat-square)](https://codecov.io/gh/kuitos/axios-extensions)
[![npm downloads](https://img.shields.io/npm/dt/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)

**Composable Axios adapter enhancers for cache, throttle, and retry.**

[Quick Start](#quick-start) • [API](#api) • [Migration](./MIGRATION.md) • [npm](https://www.npmjs.com/package/axios-extensions)

</div>

axios-extensions gives you production-friendly request behavior without replacing Axios itself.

> This README targets **v4.x**. Looking for older docs? See [v3.1.7](https://github.com/kuitos/axios-extensions/tree/v3.1.7).
>
> Migrating from v3? Read **[MIGRATION.md](./MIGRATION.md)**.

## Table of Contents

- [Why axios-extensions](#why-axios-extensions)
- [Version & Compatibility](#version--compatibility)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API](#api)
  - [`cacheAdapterEnhancer`](#cacheadapterenhancer)
  - [`throttleAdapterEnhancer`](#throttleadapterenhancer)
  - [`retryAdapterEnhancer`](#retryadapterenhancer)
- [TypeScript Notes](#typescript-notes)
- [Logging](#logging)
- [Development](#development)
- [License](#license)

## Highlights

- ⚡ **Composable by design**: stack cache, throttle, and retry in one adapter pipeline.
- 🧠 **Sensible defaults**: GET caching, GET-only throttling, and retry controls out of the box.
- 🧩 **TypeScript-ready**: request config is module-augmented for feature flags and overrides.
- 🪶 **Lightweight**: focused utilities with no framework lock-in.

## Why axios-extensions

| Enhancer | What it does | Typical use case |
| --- | --- | --- |
| `cacheAdapterEnhancer` | Request-level response caching | Avoid duplicate reads for the same resource |
| `throttleAdapterEnhancer` | Dedupe/throttle GET requests inside a time window | Prevent burst requests during rapid UI interactions |
| `retryAdapterEnhancer` | Retry failed requests with global/per-request overrides | Improve resilience on flaky networks |

These enhancers are designed to be **composed together** on top of Axios adapters.

### Pick the right enhancer

| If you want to... | Use |
| --- | --- |
| Avoid duplicate reads and reuse response results | `cacheAdapterEnhancer` |
| Collapse repeated GET requests in rapid bursts | `throttleAdapterEnhancer` |
| Survive transient network/backend failures | `retryAdapterEnhancer` |

## Version & Compatibility

| Package | Supported version |
| --- | --- |
| Node.js | `>= 18` |
| axios | `>= 1.0.0` |

`axios v0.19.0` is not supported due to an Axios custom config issue: https://github.com/axios/axios/pull/2207

## Installation

```bash
npm i axios-extensions
```

```bash
yarn add axios-extensions
```

Browser UMD build:

```html
<!-- exposed as window['axios-extensions'] -->
<script src="https://unpkg.com/axios-extensions/dist/axios-extensions.min.js"></script>
```

## Quick Start

Compose all three enhancers in one adapter:

```ts
import axios from 'axios';
import {
	cacheAdapterEnhancer,
	throttleAdapterEnhancer,
	retryAdapterEnhancer,
} from 'axios-extensions';

const adapter = retryAdapterEnhancer(
	throttleAdapterEnhancer(
		cacheAdapterEnhancer(axios.defaults.adapter!),
		{ threshold: 1000 },
	),
	{ times: 2 },
);

export const http = axios.create({
	baseURL: '/api',
	adapter,
});
```

Per-request overrides:

```ts
await http.get('/users', {
	forceUpdate: true,
	threshold: 3000,
	retryTimes: 3,
});
```

Common composition presets:

```ts
// 1) Cache only
const cacheOnly = cacheAdapterEnhancer(axios.defaults.adapter!);

// 2) Cache + throttle (great for list/search pages)
const cacheAndThrottle = throttleAdapterEnhancer(
	cacheAdapterEnhancer(axios.defaults.adapter!),
	{ threshold: 1000 },
);

// 3) Full resilience pipeline
const resilient = retryAdapterEnhancer(cacheAndThrottle, { times: 2 });
```

## API

### `cacheAdapterEnhancer`

When to use: cache requests (GET by default) and optionally customize cache strategy/key generation.

```ts
cacheAdapterEnhancer(adapter: NonNullable<AxiosRequestConfig['adapter']>, options?: {
	cacheable?: (config: AxiosRequestConfig) => boolean | ICacheLike<any>;
	keyGenerator?: (config: AxiosRequestConfig) => string;
	defaultCache?: ICacheLike<AxiosPromise>;
}): AxiosAdapter
```

Default behavior:

- If `config.cache` is set, it is used as override
- Otherwise GET requests are cached
- Default cache store is `new Cache({ ttl: 5 * 60 * 1000, max: 100 })`

Common request options (module-augmented on `AxiosRequestConfig`):

- `cache?: boolean | ICacheLike<any>`
- `forceUpdate?: boolean`

Example: enable cache for GET by default, but force refresh per request:

```ts
await http.get('/users', { forceUpdate: true });
```

Example: opt-in cache only:

```ts
const adapter = cacheAdapterEnhancer(axios.defaults.adapter!, {
	cacheable: config => config.cache ?? false,
});
```

Example: cache GET + POST with a URL-only key (safe only when params/body do not affect response):

```ts
const adapter = cacheAdapterEnhancer(axios.defaults.adapter!, {
	cacheable: config => config.method === 'get' || config.method === 'post',
	keyGenerator: config => `${config.method}:${config.url}`,
});
```

`config.url` alone is only safe when query params/body do not change response semantics. Otherwise include `params` and (for non-GET) `data` in the key.

### `throttleAdapterEnhancer`

When to use: dedupe GET requests triggered repeatedly within a short interval.

```ts
throttleAdapterEnhancer(adapter: NonNullable<AxiosRequestConfig['adapter']>, options?: {
	threshold?: number;
	cache?: ICacheLike<{ timestamp: number; value?: AxiosPromise }>;
}): AxiosAdapter
```

Default behavior:

- Only affects **GET** requests
- Requests within `threshold` (default `1000ms`) reuse in-flight/previous promise
- Non-GET requests pass through untouched

Request-level override:

- `threshold?: number` on `AxiosRequestConfig`

```ts
await http.get('/users', { threshold: 3000 });
```

### `retryAdapterEnhancer`

When to use: retry transient failures without rewriting request logic.

```ts
retryAdapterEnhancer(adapter: AxiosAdapter, options?: {
	times?: number;
}): AxiosAdapter
```

Default behavior:

- Retries failed requests up to `times` (default `2`)
- Per-request override via `retryTimes?: number`

```ts
await http.get('/critical-endpoint', { retryTimes: 3 });
```

## TypeScript Notes

`axios-extensions` augments Axios request types for:

- `cache`
- `forceUpdate`
- `threshold`
- `retryTimes`

When importing shared cache contracts in TypeScript, use type-only imports:

```ts
import type { ICacheLike } from 'axios-extensions';
```

If your project has strict interop settings, enabling these can improve import ergonomics:

- `esModuleInterop: true`
- `allowSyntheticDefaultImports: true`

## Logging

Set `process.env.LOGGER_LEVEL=info` in Node-based development to enable internal info logging.

## Development

```bash
npm run lint
npm test
npm run build
```

## License

MIT
