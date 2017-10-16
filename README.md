# axios-extensions

[![Build Status](https://img.shields.io/travis/kuitos/axios-extensions.svg?style=flat-square)](https://travis-ci.org/kuitos/axios-extensions)
[![npm version](https://img.shields.io/npm/v/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)
[![npm downloads](https://img.shields.io/npm/dt/axios-extensions.svg?style=flat-square)](https://www.npmjs.com/package/axios-extensions)
[![coverage](https://img.shields.io/codecov/c/github/kuitos/axios-extensions.svg?style=flat-square)](https://codecov.io/gh/kuitos/axios-extensions)

## example

```javascript
import { cacheAdapterEnhancer, throttleAdapterEnhancer, normalizeInterceptor } from 'axios-extensions';

const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' },
	adapter: throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter))
});
http.interceptors.response.use(normalizeInterceptor.response);
```
