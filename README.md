# axios-extensions

[![npm version](https://img.shields.io/npm/v/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)
[![coverage](https://img.shields.io/codecov/c/github/kuitos/axios-extensions.svg?style=flat-square)](https://codecov.io/gh/kuitos/axios-extensions)
[![npm downloads](https://img.shields.io/npm/dt/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)
[![Build Status](https://img.shields.io/travis/kuitos/axios-extensions.svg?style=flat-square)](https://travis-ci.org/kuitos/axios-extensions)

A non-invasive, simple, reliable collection of axios extension

## Extension List
*v3.x has a lot of api changes, if you are looking for v2.x doc, see [here](https://github.com/kuitos/axios-extensions/tree/v2.0.3)*

* [cacheAdapterEnhancer](#cacheadapterenhancer) make request cacheable
* [throttleAdapterEnhancer](#throttleadapterenhancer) make request throttled automatic

## Installing
```bash
npm i axios-extensions -S
```
or
```bash
yarn add axios-extensions
```

## Usage

```javascript
import axios from 'axios';
import { cacheAdapterEnhancer, throttleAdapterEnhancer } from 'axios-extensions';

// enhance the original axios adapter with throttle and cache enhancer 
const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	adapter: throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter))
});
```

### Enable Logging

It is highly recommended to enable the request logging recorder in development environment(it is disabled in default).

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

```
cacheAdapterEnhancer(adapter, options) : enhancedAdapter
```

Where `adapter` is an axios adapter that will be cached, `options` is an optional that configuring caching: 

| Param | Default value | Description | 
| --- | --- | --- |
| `enabledByDefault` |  `true` | Enables cache for all requests without explicit definition in every request (e.g. `cache: true`) |
| `cacheFlag` | `'cache'` | Configures key (flag) for explicit definition of cache usage in axios request |
| `defaultCache` | <pre>`new LRUCache({ maxAge: FIVE_MINUTES })`</pre>| Cache object that will be used for storing cached requests |

`cacheAdapterEnhancer` enhances axios adapter and return it back. So you can use this adapter for another purpose, e.g. throttle using `throttleAdapterEnhancer`.

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
http.get('/users', { cache: false }); // disable cache manually and the the real http request invoked
```

#### custom cache flag

```javascript
const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	// disable the default cache and set the cache flag
	adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false, cacheFlag: 'useCache'})
});

http.get('/users'); // default cache was disabled and then the real http request invoked 
http.get('/users', { useCache: true }); // make the request cacheable(real http request made due to first request invoke)
http.get('/users', { useCache: true }); // use the response cache from previous request
```

#### more advanced

Besides configuring the request through the `cacheAdapterEnhancer`, we can enjoy more advanced features via configuring every individual request.

```js
import axios from 'axios';
import { cacheAdapterEnhancer, Cache } from 'axios-extensions';

const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	// disable the default cache
	adapter: cacheAdapterEnhancer(axios.defaults.adapter, { enabledByDefault: false })
});

http.get('/users', { cache: true }); // make the request cacheable(real http request made due to first request invoke)

// define a cache manually
const cacheA = new Cache();
// or a cache-like instance
const cacheB = { get() {/*...*/}, set() {/*...*/}, del() {/*...*/} };

// two actual request will be made due to the different cache 
http.get('/users', { cache: cacheA });
http.get('/users', { cache: cacheB });

// a actual request made and cached due to force update configured
http.get('/users', { cache: cacheA, forceUpdate: true });
```

### throttleAdapterEnhancer

> throttle requests most once per threshold milliseconds

```
throttleAdapterEnhancer(adapter, options) : enhancedAdapter
```

Where `adapter` is an axios adapter that will be throttled, `options` is an optional object that configuring throttling: 

| Param | Default value | Description | 
| --- | --- | --- |
| `threshold` |  `1000` | The number of milliseconds to throttle request invocations to |
| `cache` | <nobr>`new LRUCache({ max: 10 })`</nobr> | Cache object that will be used for storing throttled requests |

`throttleAdapterEnhancer` enhances axios adapter and return it back. So you can use this adapter for another purpose, e.g. cache using `cacheAdapterEnhancer`.

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
http.get('/users'); // responsed from the cache
http.get('/users'); // responsed from the cache

setTimeout(() => {
	http.get('/users'); // after 2s, the real request makes again
}, 2 * 1000);
```
