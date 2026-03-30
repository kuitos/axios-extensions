# axios-extensions

[![npm version](https://img.shields.io/npm/v/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)
[![build](https://img.shields.io/github/actions/workflow/status/kuitos/axios-extensions/ci.yml?branch=master&style=flat-square)](https://github.com/kuitos/axios-extensions/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/kuitos/axios-extensions.svg?style=flat-square)](https://codecov.io/gh/kuitos/axios-extensions)
[![npm downloads](https://img.shields.io/npm/dt/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)

Lightweight adapter enhancers for Axios:

- **`cacheAdapterEnhancer`**: request-level caching with custom cache strategy support
- **`throttleAdapterEnhancer`**: dedupe/throttle GET calls inside a threshold window
- **`retryAdapterEnhancer`**: retry failed requests with global or per-request overrides

> This README targets **v4.x**. Looking for older docs? See [v3.1.7](https://github.com/kuitos/axios-extensions/tree/v3.1.7).
>
> Migrating from v3? Read **[MIGRATION.md](./MIGRATION.md)**.

## Requirements

| Package | Supported version |
| --- | --- |
| Node.js | `>= 18` |
| axios | `>= 1.0.0` |

`axios v0.19.0` is not supported due to an Axios custom config issue: https://github.com/axios/axios/pull/2207

## Installation

```bash
npm i axios-extensions
```

or

```bash
yarn add axios-extensions
```

Browser UMD build:

```html
<!-- exposed as window['axios-extensions'] -->
<script src="https://unpkg.com/axios-extensions/dist/axios-extensions.min.js"></script>
```

## Quick Start

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

## API

### `cacheAdapterEnhancer`

```ts
cacheAdapterEnhancer(adapter: AxiosRequestConfig['adapter'], options?: {
	cacheable?: (config: AxiosRequestConfig) => boolean | ICacheLike<any>;
	keyGenerator?: (config: AxiosRequestConfig) => string;
	defaultCache?: ICacheLike<AxiosPromise>;
}): AxiosAdapter
```

Default behavior:

- If `config.cache` is set, it is used as override
- Otherwise GET requests are cached
- Default cache store is `new Cache({ ttl: 5min, max: 100 })`

Common request options (module-augmented on `AxiosRequestConfig`):

- `cache?: boolean | ICacheLike<any>`
- `forceUpdate?: boolean`

Example: enable cache for GET by default, but force a refresh per request:

```ts
await http.get('/users', { forceUpdate: true });
```

Example: opt-in cache only:

```ts
const adapter = cacheAdapterEnhancer(axios.defaults.adapter!, {
	cacheable: config => config.cache ?? false,
});
```

Example: cache GET + POST with a method-aware cache key:

```ts
const adapter = cacheAdapterEnhancer(axios.defaults.adapter!, {
	cacheable: config => config.method === 'get' || config.method === 'post',
	keyGenerator: config => `${config.method}:${config.url}`,
});
```

`config.url` alone is only safe when query params/body do not change response semantics. Otherwise include `params` and (for non-GET) `data` in the key.

### `throttleAdapterEnhancer`

```ts
throttleAdapterEnhancer(adapter: AxiosRequestConfig['adapter'], options?: {
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

Set `process.env.LOGGER_LEVEL=info` to enable internal info logging in development.

## Development

```bash
npm run lint
npm test
npm run build
```

## License

MIT
