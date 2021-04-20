/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-16
 */

import test from 'ava';
import axios, {
	AxiosPromise,
} from 'axios';
import LRUCache from 'lru-cache';
import { Console } from 'node:console';
import {
	spy,
} from 'sinon';

import swrCacheAdapterEnhancer from '../swrCacheAdapterEnhancer';

const delay = (timeout: number) => new Promise((r) => setTimeout(r, timeout));

// mock the actual request
const genMockAdapter = (cb: any) => async (config: any) => {
	await delay(3);
	cb();
	//  console.log("response");
	if (config.error) {
		return Promise.reject(config);
	}
	return Promise.resolve(config);
};

test('cache adapter should cache request and revalidate it without flags', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: swrCacheAdapterEnhancer(mockedAdapter, {
			enabledByDefault: true,
		}),
	});

	const onSuccess = spy();

	for (let i = 0; i < 5; i++) {
        // call api
		await http.get('/users').then(onSuccess);

        // delay some time (for revalidation occur)
		await delay(5);

		if (i === 0) {
            // first time request call first (and cached)
			t.is(adapterCb.getCall(0).calledBefore(onSuccess.getCall(0)), true);
        } else {
            // then deliver the cache and call the request (for revalidate)
            t.is(adapterCb.getCall(i).calledAfter(onSuccess.getCall(i)), true);
        }
	}

	t.is(onSuccess.callCount, 5);
	t.is(adapterCb.callCount, 5); // 1x for caching 4x for revalidate

	// new request
	await http.get('/users', { params: { name: 'kuitos' } }).then(onSuccess);
	t.is(onSuccess.callCount, 6);
	t.is(adapterCb.callCount, 6);
	t.is(adapterCb.getCall(0).calledBefore(onSuccess.getCall(0)), true);

	// cached request
	await http.get('/users', { params: { name: 'kuitos' }, cache: true } as any).then(onSuccess);
 await delay(5);
	t.is(onSuccess.callCount, 7);
	t.is(adapterCb.callCount, 7);
 t.is(adapterCb.getCall(0).calledBefore(onSuccess.getCall(0)), true);

});

test('cache adapter should cache request without stealWhileRevalidate', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: swrCacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true }),
	});

	const onSuccess = spy();
	const promises = [];

	for (let i = 0; i < 5; i++) {
		promises.push(http.get('/users', { stealWhileRevalidate: false }).then(onSuccess));
	}

	await Promise.all(promises);

	t.is(onSuccess.callCount, 5);
	t.is(adapterCb.callCount, 1);
	t.is(adapterCb.calledBefore(onSuccess), true);

	await http.get('/users', { params: { name: 'kuitos' }, stealWhileRevalidate: false }).then(onSuccess);
	t.is(onSuccess.callCount, 6);
	t.is(adapterCb.callCount, 2);

	await http.get('/users', { params: { name: 'kuitos' }, cache: true, stealWhileRevalidate: false } as any).then(onSuccess);
	t.is(onSuccess.callCount, 7);
	t.is(adapterCb.callCount, 2);

});

test('cache adapter should cache request and revalidate based on keepAlive it without flags', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: swrCacheAdapterEnhancer(mockedAdapter, {
			enabledByDefault: true,
		}),
	});

	const onSuccess = spy();

	for (let i = 0; i < 5; i++) {
        // call api
		await http.get('/users', { keepAlive: 100 }).then(onSuccess);

        // delay some time (for revalidation occur)
		await delay(5);
	}

	t.is(onSuccess.callCount, 5);
	t.is(adapterCb.callCount, 1); // 1x for caching

	await delay(100);
	await http.get('/users', { keepAlive: 100 }).then(onSuccess);
	t.is(onSuccess.callCount, 6);
	t.is(adapterCb.callCount, 1); // before revalidate (expired keepAlive)
	await delay(5);
	t.is(adapterCb.callCount, 2); // after revalidate (expired keepAlive)

	await delay(100);
	await http.get('/users').then(onSuccess);
	t.is(onSuccess.callCount, 7);
	t.is(adapterCb.callCount, 2); // before revalidate (expired keepAlive)
	await delay(5);
	t.is(adapterCb.callCount, 3); // after revalidate (expired keepAlive)
});

test('cache adapter shouldn\'t cache request with noCacheFlag', async t => {

	 const adapterCb = spy();
	 const mockedAdapter = genMockAdapter(adapterCb);
	 const http = axios.create({
		 adapter: swrCacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true, cacheFlag: 'cache' }),
	 });

	 const onSuccess = spy();
	 await Promise.all([
		 http.get('/users', { cache: false } as any).then(onSuccess),
		 http.get('/users', { cache: false } as any).then(onSuccess),
	 ]);
	 t.is(onSuccess.callCount, 2);
	 t.is(adapterCb.callCount, 2);

 });

test('cache will be removed when request error', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
	 adapter: swrCacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true }),
	});

	const onSuccess = spy();
	const onError = spy();
	await Promise.all([
	 http.get('/users', { error: true } as any).then(onSuccess, onError),
	 http.get('/users').then(onSuccess, onError),
	]);
	await delay(5);
	// as the previous uses invocation failed, the following users request will respond with the rejected promise
	t.is(onSuccess.callCount, 0);
	t.is(onError.callCount, 2);
	t.is(adapterCb.callCount, 2);

	for (let i = 0; i < 5; i++) {
        // call api
		await http.get('/users', { keepAlive: 100 }).then(onSuccess, onError);

        // delay some time (for revalidation occur)
		await delay(5);
	}
	t.is(onSuccess.callCount, 5);
	t.is(adapterCb.callCount, 3);

 });

test('cache will be removed when revalidate request error', async t => {
	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
	 adapter: swrCacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true }),
	});

	const onSuccess = spy();
	const onError = spy();
	await Promise.all([
	 http.get('/users', { error: true } as any).then(onSuccess, onError),
	 http.get('/users').then(onSuccess, onError),
	]);
	await delay(5);
	// as the previous uses invocation failed, the following users request will respond with the rejected promise
	t.is(onSuccess.callCount, 0);
	t.is(onError.callCount, 2);
	t.is(adapterCb.callCount, 2);

	await http.get('/users', { keepAlive: 20 }).then(onSuccess, onError);
	await delay(25);

	await http.get('/users', { error: true, keepAlive: 20 } as any).then(onSuccess, onError);

	await delay(5);

	t.is(onSuccess.callCount, 2); // cache served
	t.is(onError.callCount, 2); // cache served (revalidate call after cache deliver so there is no error)
	t.is(adapterCb.callCount, 4); // 2 more revalidation call

	// but there is no cache for now (cleaned in revalidation error)
	http.get('/users').then(onSuccess, onError),
	await delay(5);
	t.is(adapterCb.lastCall.calledBefore(onSuccess.lastCall), true);

 });

test('disable default cache switcher', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
	 adapter: swrCacheAdapterEnhancer(mockedAdapter),
	});

	const onSuccess = spy();

	await http.get('/users', { keepAlive: 5 }).then(onSuccess);
	await http.get('/users', { keepAlive: 5 }).then(onSuccess);
	await http.get('/users', { cache: false } as any).then(onSuccess);

	t.is(onSuccess.callCount, 3);
	t.is(adapterCb.callCount, 2);

 });

test('request will refresh the cache with forceUpdate config', async t => {

	 const adapterCb = spy();
	 const mockedAdapter = genMockAdapter(adapterCb);
	 const cache = new LRUCache<string, AxiosPromise>();
	 const http = axios.create({
		 adapter: swrCacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true, cacheFlag: 'cache', defaultCache: cache }),
	 });

	 const onSuccess = spy();
	 await http.get('/users').then(onSuccess);
	 const responed1 = await cache.get('/users') as any;
	 await http.get('/users', { forceUpdate: true } as any).then(onSuccess);
	 const responed2 = await cache.get('/users') as any;
	 t.is(adapterCb.callCount, 2);
	 t.is(onSuccess.callCount, 2);

	 if (responed1) {
		 t.is(responed1.url, '/users');
		 t.is(responed1.url, responed2.url);
	 }

	 t.not(responed1, responed2);

 });

test('request will refresh the SWR cache with forceUpdate config', async t => {

	 const adapterCb = spy();
	 const mockedAdapter = genMockAdapter(adapterCb);
	 const cache = new LRUCache<string, Date>();
	 const http = axios.create({
		 adapter: swrCacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true, swrDefaultCache: cache }),
	 });

	 const onSuccess = spy();
	 await http.get('/users', { keepAlive: 15 }).then(onSuccess);
	 const responed1 = await cache.get('/users') as any;
	 await delay(5);
	 await http.get('/users', { forceUpdate: true, keepAlive: 15 } as any).then(onSuccess);
	 const responed2 = await cache.get('/users') as any;
	 t.is(adapterCb.callCount, 2);
	 t.is(onSuccess.callCount, 2);

	 t.not(responed1, responed2);

 });

test('use a custom cache with request individual config', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
	 adapter: swrCacheAdapterEnhancer(mockedAdapter),
	});

	const cache1 = new LRUCache();
	const cache2 = new LRUCache();
	await Promise.all([
			http.get('/users', { cache: cache1, keepAlive: 15 } as any),
			http.get('/users', { cache: cache2, keepAlive: 15 } as any),
		]);

	await delay(5);
	t.is(adapterCb.callCount, 2);

	cache2.reset();
	await Promise.all([
		http.get('/users', { cache: cache1, keepAlive: 15 } as any),
		http.get('/users', { cache: cache2, keepAlive: 15 } as any),
	]);

	await delay(5);
	t.is(adapterCb.callCount, 3);

 });

test('use a custom SWR cache with request individual config', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
	 adapter: swrCacheAdapterEnhancer(mockedAdapter, { stealWhileRevalidateFlag: 'swr', keepAliveFlag: 'alive' }),
	});

	const swrCache1 = new LRUCache();
	const swrCache2 = new LRUCache();
	await Promise.all([
			http.get('/users', { swr: swrCache1, alive: 15 } as any),
			http.get('/users', { swr: swrCache2, alive: 15 } as any),
		]);

	await delay(5);
	t.is(adapterCb.callCount, 2);

	swrCache2.reset();
	await Promise.all([
		http.get('/users', { swr: swrCache1, alive: 15 } as any),
		http.get('/users', { swr: swrCache2, alive: 15 } as any),
	]);

	await delay(5);
	t.is(adapterCb.callCount, 3);

 });
