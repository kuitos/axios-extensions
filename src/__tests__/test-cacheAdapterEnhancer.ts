import axios, { AxiosPromise, AxiosRequestConfig } from 'axios';
import { spy } from 'sinon';
import { describe, expect, it } from 'vitest';

import Cache from '../Cache';
import cacheAdapterEnhancer from '../cacheAdapterEnhancer';
import genMockAdapter from '../testUtils/mockAdapter';

describe('cacheAdapterEnhancer', () => {
	it('cache adapter should cache GET requests by default', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: cacheAdapterEnhancer(mockedAdapter),
		});

		const onSuccess = spy();
		const promises = [];

		for (let i = 0; i < 5; i++) {
			promises.push(http.get('/users').then(onSuccess));
		}

		await Promise.all(promises);

		expect(onSuccess.callCount).toBe(5);
		expect(adapterCb.callCount).toBe(1);
		expect(adapterCb.calledBefore(onSuccess)).toBe(true);

		await http.get('/users', { params: { name: 'kuitos' } }).then(onSuccess);
		expect(onSuccess.callCount).toBe(6);
		expect(adapterCb.callCount).toBe(2);

		await http.get('/users', { params: { name: 'kuitos' }, cache: true } as any).then(onSuccess);
		expect(onSuccess.callCount).toBe(7);
		expect(adapterCb.callCount).toBe(2);
	});

	it('cache adapter should skip cache when cache:false is set per-request', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: cacheAdapterEnhancer(mockedAdapter),
		});

		const onSuccess = spy();
		await Promise.all([
			http.get('/users', { cache: false } as any).then(onSuccess),
			http.get('/users', { cache: false } as any).then(onSuccess),
		]);
		expect(onSuccess.callCount).toBe(2);
		expect(adapterCb.callCount).toBe(2);
	});

	it('cache will be removed when request error', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: cacheAdapterEnhancer(mockedAdapter),
		});

		const onSuccess = spy();
		const onError = spy();
		await Promise.all([
			http.get('/users', { error: true } as any).then(onSuccess, onError),
			http.get('/users').then(onSuccess, onError),
		]);
		expect(onSuccess.callCount).toBe(0);
		expect(onError.callCount).toBe(2);
		expect(adapterCb.callCount).toBe(1);

		await Promise.all([
			http.get('/users').then(onSuccess, onError),
			http.get('/users').then(onSuccess, onError),
		]);
		expect(onSuccess.callCount).toBe(2);
		expect(adapterCb.callCount).toBe(2);
	});

	it('request will refresh the cache with forceUpdate config', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const cache = new Cache<AxiosPromise>({ max: 100 });
		const http = axios.create({
			adapter: cacheAdapterEnhancer(mockedAdapter, { defaultCache: cache }),
		});

		const onSuccess = spy();
		await http.get('/users').then(onSuccess);
		const responed1 = await cache.get('/users') as any;
		await http.get('/users', { forceUpdate: true } as any).then(onSuccess);
		const responed2 = await cache.get('/users') as any;
		expect(adapterCb.callCount).toBe(2);
		expect(onSuccess.callCount).toBe(2);

		if (responed1) {
			expect(responed1.url).toBe('/users');
			expect(responed1.url).toBe(responed2.url);
		}

		expect(responed1).not.toBe(responed2);
	});

	it('use a custom cache instance per-request via cacheable', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: cacheAdapterEnhancer(mockedAdapter),
		});

		const cache1 = new Cache({ max: 100 });
		const cache2 = new Cache({ max: 100 });
		await Promise.all([http.get('/users', { cache: cache1 } as any), http.get('/users', { cache: cache2 } as any)]);
		expect(adapterCb.callCount).toBe(2);

		cache2.clear();
		await Promise.all([http.get('/users', { cache: cache1 } as any), http.get('/users', { cache: cache2 } as any)]);

		expect(adapterCb.callCount).toBe(3);
	});

	it('cache adapter should resolve adapter names via axios.getAdapter', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const originalGetAdapter = axios.getAdapter;
		const adapterName = 'http';

		const getAdapterSpy = spy((value: Parameters<typeof originalGetAdapter>[0]) => {
			expect(value).toBe(adapterName);
			return mockedAdapter;
		});
		axios.getAdapter = getAdapterSpy;
		try {
			const http = axios.create({
				adapter: cacheAdapterEnhancer(adapterName),
			});

			await http.get('/users');

			expect(getAdapterSpy.callCount).toBe(1);
			expect(adapterCb.callCount).toBe(1);
		} finally {
			axios.getAdapter = originalGetAdapter;
		}
	});

	it('cache adapter should not throw when process is undefined', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const originalProcess = process;

		Object.defineProperty(globalThis, 'process', {
			value: undefined,
			configurable: true,
			writable: true,
		});

		try {
			const http = axios.create({
				adapter: cacheAdapterEnhancer(mockedAdapter),
			});

			await http.get('/users');
			await http.get('/users');

			expect(adapterCb.callCount).toBe(1);
		} finally {
			Object.defineProperty(globalThis, 'process', {
				value: originalProcess,
				configurable: true,
				writable: true,
			});
		}
	});

	it('cache adapter should support caching POST requests with cacheable predicate', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: cacheAdapterEnhancer(mockedAdapter, {
				cacheable: (config: AxiosRequestConfig) => config.method === 'get' || config.method === 'post',
				keyGenerator: (config: AxiosRequestConfig) => `${config.method}:${config.url}`,
			}),
		});

		await http.post('/users', { name: 'kuitos' });
		await http.post('/users', { name: 'kuitos' });

		expect(adapterCb.callCount).toBe(1);

		await http.get('/users');
		expect(adapterCb.callCount).toBe(2);
	});

	it('cache adapter should not cache POST requests by default', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: cacheAdapterEnhancer(mockedAdapter),
		});

		await http.post('/users', { name: 'kuitos' });
		await http.post('/users', { name: 'kuitos' });

		expect(adapterCb.callCount).toBe(2);
	});

	it('cache adapter should mark cached responses with __fromCache only on cache hit', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: cacheAdapterEnhancer(mockedAdapter),
		});

		const firstResponse = await http.get('/users');
		expect(Reflect.get(firstResponse, '__fromCache')).toBeUndefined();

		const secondResponse = await http.get('/users');
		expect(Reflect.get(secondResponse, '__fromCache')).toBe(true);
		expect(adapterCb.callCount).toBe(1);
	});

	it('cache adapter should support custom cache key generator', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: cacheAdapterEnhancer(mockedAdapter, {
				keyGenerator: (config: AxiosRequestConfig) => config.url || '',
			}),
		});

		await http.get('/users', { params: { name: 'kuitos' } });
		await http.get('/users', { params: { name: 'suhaotian' } });

		expect(adapterCb.callCount).toBe(1);
	});

	it('should isolate cache entries by baseURL while reusing matching baseURL requests', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: cacheAdapterEnhancer(mockedAdapter),
		});

		const resA1 = await http.get('/users', { baseURL: 'https://a.example' }) as any;
		const resB1 = await http.get('/users', { baseURL: 'https://b.example' }) as any;
		const resA2 = await http.get('/users', { baseURL: 'https://a.example' }) as any;
		const resB2 = await http.get('/users', { baseURL: 'https://b.example' }) as any;

		expect(adapterCb.callCount).toBe(2);
		expect(resA1.baseURL).toBe('https://a.example');
		expect(resB1.baseURL).toBe('https://b.example');
		expect(resA2.baseURL).toBe('https://a.example');
		expect(resA2.__fromCache).toBe(true);
		expect(resB2.baseURL).toBe('https://b.example');
		expect(resB2.__fromCache).toBe(true);
	});

	it('should isolate shared defaultCache across instances with different baseURLs', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const sharedCache = new Cache<AxiosPromise>({ max: 100 });
		const clientA = axios.create({
			baseURL: 'https://a.example',
			adapter: cacheAdapterEnhancer(mockedAdapter, { defaultCache: sharedCache }),
		});
		const clientB = axios.create({
			baseURL: 'https://b.example',
			adapter: cacheAdapterEnhancer(mockedAdapter, { defaultCache: sharedCache }),
		});

		const resA = await clientA.get('/users') as any;
		const resB = await clientB.get('/users') as any;
		const resA2 = await clientA.get('/users') as any;

		expect(adapterCb.callCount).toBe(2);
		expect(resA.baseURL).toBe('https://a.example');
		expect(resB.baseURL).toBe('https://b.example');
		expect(resB.__fromCache).toBeUndefined();
		expect(resA2.__fromCache).toBe(true);
	});

	it('should respect allowAbsoluteUrls and paramsSerializer in default cache key', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			baseURL: 'https://a.example',
			adapter: cacheAdapterEnhancer(mockedAdapter),
		});

		await http.get('https://other.example/users', { allowAbsoluteUrls: true });
		await http.get('https://other.example/users', { allowAbsoluteUrls: false });
		expect(adapterCb.callCount).toBe(2);

		await http.get('/users', { params: { a: [1, 2] }, paramsSerializer: { indexes: null } });
		await http.get('/users', { params: { a: [1, 2] }, paramsSerializer: { indexes: true } });
		expect(adapterCb.callCount).toBe(4);
	});
});
