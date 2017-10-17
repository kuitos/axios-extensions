# axios-extensions

[![Build Status](https://img.shields.io/travis/kuitos/axios-extensions.svg?style=flat-square)](https://travis-ci.org/kuitos/axios-extensions)
[![npm version](https://img.shields.io/npm/v/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)
[![npm downloads](https://img.shields.io/npm/dt/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)
[![coverage](https://img.shields.io/codecov/c/github/kuitos/axios-extensions.svg?style=flat-square)](https://codecov.io/gh/kuitos/axios-extensions)

## example

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

## Document

### cacheAdapterEnhancer(adapter, cacheEnabledByDefault = true, enableCacheFlag = 'cache', cacheAge = FIVE_MINUTES) : enhancedAdapter
make axios cacheable, default cache flag

#### default usage

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
http.get('/users'); // use the response with the previous request from cache, without real http request
http.get('/users', { cache: false }); // disable cache manually and the the real http request invoked   

```

#### custom cache flag

```javascript
const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	// disable the default cache and set the cache flag
	adapter: cacheAdapterEnhancer(axios.defaults.adapter, false, 'useCache')
});

http.get('/users', ); // default cache was disabled and then the real http request invoked 
http.get('/users', { useCache: true }); // make the request cacheable(real http request made due to first request invoke)
http.get('/users', { useCache: true }); // use the response cache from previous request
```

### throttleAdapterEnhancer(adapter, threshold = 1000, cacheCapacity = 10) : enhancedAdapter
throttle requests at most once per every threshold milliseconds
