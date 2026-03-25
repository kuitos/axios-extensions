# axios-extensions

[![npm version](https://img.shields.io/npm/v/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)
[![coverage](https://img.shields.io/codecov/c/github/kuitos/axios-extensions.svg?style=flat-square)](https://codecov.io/gh/kuitos/axios-extensions)
[![npm downloads](https://img.shields.io/npm/dt/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)
[![Build Status](https://img.shields.io/github/actions/workflow/status/kuitos/axios-extensions/ci.yml?branch=master&style=flat-square)](https://github.com/kuitos/axios-extensions/actions/workflows/ci.yml)

A non-invasive, simple, reliable collection of axios extensions.

## Extension List
*This README targets v4.x. If you are looking for older docs, see [v3.1.7](https://github.com/kuitos/axios-extensions/tree/v3.1.7) or [v2.0.3](https://github.com/kuitos/axios-extensions/tree/v2.0.3).* 

*v4.x requires Node.js >= 18 and axios >= 1.0.0.*

*Not compatible with axios v0.19.0 due to a custom config bug. See https://github.com/axios/axios/pull/2207.*   

* [cacheAdapterEnhancer](#cacheadapterenhancer) makes requests cacheable
* [throttleAdapterEnhancer](#throttleadapterenhancer) makes GET requests throttled automatically
* [retryAdapterEnhancer](#retryadapterenhancer) retries failed requests a configurable number of times

## Installing
```bash
npm i axios-extensions
```
or
```bash
yarn add axios-extensions
```

or 
```html
// exposed as window['axios-extensions']
<script src="https://unpkg.com/axios-extensions/dist/axios-extensions.min.js"></script>
```

## Usage

```javascript
import axios from 'axios';
import { cacheAdapterEnhancer, throttleAdapterEnhancer } from 'axios-extensions';

// Enhance the original axios adapter with throttle and cache enhancers.
const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	adapter: throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter))
});
```

### Enable Logging

It is highly recommended to enable request logging in development environments (disabled by default).

#### browser (webpack)
```js
new webpack.DefinePlugin({
  'process.env.LOGGER_LEVEL': JSON.stringify('info')
})
```
#### node
```json
// package.json
"scripts": {
	"start": "cross-env LOGGER_LEVEL=info node server.js"
}
```

## API

### cacheAdapterEnhancer

> Makes axios cacheable

```typescript
cacheAdapterEnhancer(adapter: AxiosAdapter, options?: Options): AxiosAdapter
```

Where `adapter` is an axios adapter that follows the [axios adapter standard](https://github.com/axios/axios/blob/master/lib/adapters/README.md), and `options` is an optional object for configuring caching:

| Param            | Type | Default value                            | Description                                                  |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------ | ---- |
| enabledByDefault | boolean                              | true | Enables cache for all requests without explicit definition in request config (e.g. `cache: true`) |
| cacheFlag        | string                            | 'cache' | Configures key (flag) for explicit definition of cache usage in axios request |
| defaultCache     | CacheLike | <pre>new LRUCache({ ttl: FIVE_MINUTES, max: 100 })</pre> | A CacheLike instance used to store requests by default, unless you define a custom cache in the request config |

`cacheAdapterEnhancer` enhances the given adapter and returns a new cacheable adapter back, so you can compose it with any other enhancers, e.g.  `throttleAdapterEnhancer`.

#### basic usage

```javascript
import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';

const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	// cache will be enabled by default
	adapter: cacheAdapterEnhancer(axios.defaults.adapter)
});

http.get('/users'); // make real http request
http.get('/users'); // use the response from the cache of previous request, without real http request made
http.get('/users', { cache: false }); // disable cache manually and make a real HTTP request
```

#### custom cache flag

```javascript
const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	// disable the default cache and set the cache flag
	adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false, cacheFlag: 'useCache'})
});

http.get('/users'); // default cache is disabled, so a real HTTP request is made
http.get('/users', { useCache: true }); // make the request cacheable (real HTTP request is made on first call)
http.get('/users', { useCache: true }); // use the response cache from previous request
```

##### custom cache typing

Note that if you are using a custom cache flag and TypeScript, you may need to add type declarations like below:

```ts
import { ICacheLike } from 'axios-extensions';
declare module 'axios' {
  interface AxiosRequestConfig {
    // if your cacheFlag is set to 'useCache'
    useCache?: boolean | ICacheLike<any>;
  }
}
```

#### more advanced

Besides configuring caching through `cacheAdapterEnhancer`, you can also configure advanced behavior per request.

```js
import axios from 'axios';
import { cacheAdapterEnhancer, Cache } from 'axios-extensions';

const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	// disable the default cache
	adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false })
});

http.get('/users', { cache: true }); // make the request cacheable (real HTTP request is made on first call)

// define a cache manually
const cacheA = new Cache({ max: 100 });
// or a cache-like instance
const cacheB = { get() {/*...*/}, set() {/*...*/}, delete() {/*...*/} };

// Two actual requests will be made because the caches are different.
http.get('/users', { cache: cacheA });
http.get('/users', { cache: cacheB });

// An actual request is made and cached due to forceUpdate.
http.get('/users', { cache: cacheA, forceUpdate: true });
```

*Note: If you are using typescript, do not forget to enable `"esModuleInterop": true` and `"allowSyntheticDefaultImports": true` for better development experience.*

### throttleAdapterEnhancer

> Throttle GET requests at most once per threshold milliseconds

```ts
throttleAdapterEnhancer(adapter: AxiosAdapter, options?: Options): AxiosAdapter
```

Where `adapter` is an axios adapter that follows the [axios adapter standard](https://github.com/axios/axios/blob/master/lib/adapters/README.md), and `options` is an optional object for configuring throttling:

| Param     | Type |Default value               | Description                                                  |
| --------- | ---- |--------------------------- | ------------------------------------------------------------ |
| threshold | number |1000                        | The number of milliseconds to throttle request invocations to |
| cache     | CacheLike |<pre>new LRUCache({ max: 10 })</pre> | CacheLike instance that will be used for storing throttled requests |

We recommend using `throttleAdapterEnhancer` together with `cacheAdapterEnhancer` for maximum caching benefits.
Note that POST and other methods besides GET are not affected. 

```js
throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter))
```

Check [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/) to learn more details about throttle and how it differs from debounce.

#### basic usage

```js
import axios from 'axios';
import { throttleAdapterEnhancer } from 'axios-extensions';

const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	adapter: throttleAdapterEnhancer(axios.defaults.adapter, { threshold: 2 * 1000 })
});

http.get('/users'); // make real http request
http.get('/users'); // responded from cache
http.get('/users'); // responded from cache

setTimeout(() => {
	http.get('/users'); // after 2s, a real request is made again
}, 2 * 1000);
```

### retryAdapterEnhancer

> Retry failed requests a configurable number of times

```ts
retryAdapterEnhancer(adapter: AxiosAdapter, options?: Options): AxiosAdapter
```

Where `adapter` is an axios adapter that follows the [axios adapter standard](https://github.com/axios/axios/blob/master/lib/adapters/README.md), and `options` is an optional object for configuring retries:
| Param            | Type | Default value                            | Description                                                  |
| ---------------- | ---------------------------------------- | ------------------------------------------------------------ | ---- |
| times | number                         | 2 | Set the retry times for failed request globally. |

#### basic usage

```ts
import axios from 'axios';
import { retryAdapterEnhancer } from 'axios-extensions';

const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	adapter: retryAdapterEnhancer(axios.defaults.adapter)
});

// this request will retry two times if it fails
http.get('/users');

// you could also set the retry times for a special request
http.get('/special', { retryTimes: 3 });
```
