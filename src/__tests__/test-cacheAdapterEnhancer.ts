/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-16
 */

import test from 'ava';
import axios from 'axios';
import LRUCache from 'lru-cache';
import { spy } from 'sinon';

import cacheAdapterEnhancer, { Cache } from '../cacheAdapterEnhancer';

// delay function (used for time skipping in revalidation)
const delay = (timeout: number) => new Promise((r) => setTimeout(r, timeout));

// mock the actual request
const genMockAdapter = (cb: any) => async (config: any) => {
	await delay(0);
	cb();
	if (config.error) {
		return Promise.reject(config);
	}
	return Promise.resolve(config);
};

test('cache adapter should cache request without noCacheFlag', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true }),
	});

	const onSuccess = spy();
	const promises = [];

	for (let i = 0; i < 5; i++) {
		promises.push(http.get('/users').then(onSuccess));
	}

	await Promise.all(promises);

	t.is(onSuccess.callCount, 5);
	t.is(adapterCb.callCount, 1);
	t.is(adapterCb.calledBefore(onSuccess), true);

	await http.get('/users', { params: { name: 'kuitos' } }).then(onSuccess);
	t.is(onSuccess.callCount, 6);
	t.is(adapterCb.callCount, 2);

	await http.get('/users', { params: { name: 'kuitos' }, cache: true } as any).then(onSuccess);
	t.is(onSuccess.callCount, 7);
	t.is(adapterCb.callCount, 2);

});

test('cache adapter shouldn\'t cache request with noCacheFlag', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true, cacheFlag: 'cache' }),
	});

	const onSuccess = spy();
	await Promise.all([
		http.get('/users', { cache: false } as any).then(onSuccess),
		http.get('/users', { cache: false } as any).then(onSuccess),
	]);
	t.is(onSuccess.callCount, 2);
	t.is(adapterCb.callCount, 2);

});

test('cache adapter should revalidate cache request with revalidate flag', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true, enabledSwrByDefault: true }),
	});

	const onSuccess = spy();

	for (let i = 0; i < 5; i++) {
		await http.get('/users').then(onSuccess);
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
	t.is(adapterCb.callCount, 5);

	await http.get('/users', { params: { name: 'kuitos' } }).then(onSuccess);
	await delay(5);
	t.is(onSuccess.callCount, 6);
	t.is(adapterCb.callCount, 6);
	t.is(adapterCb.getCall(5).calledBefore(onSuccess.getCall(5)), true);

	await http.get('/users', { params: { name: 'kuitos' }, cache: true } as any).then(onSuccess);
	await delay(5);
	t.is(onSuccess.callCount, 7);
	t.is(adapterCb.callCount, 7);
	t.is(adapterCb.getCall(6).calledAfter(onSuccess.getCall(6)), true);

});

test('cache will be removed when request error', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true }),
	});

	const onSuccess = spy();
	const onError = spy();
	await Promise.all([
		http.get('/users', { error: true } as any).then(onSuccess, onError),
		http.get('/users').then(onSuccess, onError),
	]);
	// as the previous uses invocation failed, the following users request will respond with the rejected promise
	t.is(onSuccess.callCount, 0);
	t.is(onError.callCount, 2);
	t.is(adapterCb.callCount, 1);

	await Promise.all([
		http.get('/users').then(onSuccess, onError),
		http.get('/users').then(onSuccess, onError),
	]);
	t.is(onSuccess.callCount, 2);
	t.is(adapterCb.callCount, 2);

});

test('cache will be removed when revalidation request error', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter, { revalidateFlag: 'reval', enabledByDefault: true, enabledSwrByDefault: true }),
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

	await http.get('/users', { reval: 5 } as any).then(onSuccess, onError);
	await delay(10);

	await http.get('/users', { error: true, reval: 10 } as any).then(onSuccess, onError);
	await delay(5);

	t.is(onSuccess.callCount, 2); // cache served
	t.is(onError.callCount, 2); // cache served (revalidate call after cache deliver so there is no error)
	t.is(adapterCb.callCount, 4); // 2 more revalidation call

	// but there is no cache for now (cleaned in revalidation error)
	http.get('/users').then(onSuccess, onError),
	await delay(10);
	t.is(adapterCb.lastCall.calledBefore(onSuccess.lastCall), true);

});

test('cache adapter should cache request and revalidate it (based on expired date)', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter, {
			enabledByDefault: true,
			enabledSwrByDefault: true,
		}),
	});

	const onSuccess = spy();

	for (let i = 0; i < 5; i++) {
        // call api
		await http.get('/users', { revalidate: 50 }).then(onSuccess);

        // delay some time (for revalidation occur)
		await delay(5);
	}

	t.is(onSuccess.callCount, 5);
	t.is(adapterCb.callCount, 1); // 1x for caching

	await delay(50);
	await http.get('/users', { revalidate: 50 }).then(onSuccess);
	t.is(onSuccess.callCount, 6);
	t.is(adapterCb.callCount, 1); // before revalidate (expired)
	await delay(5);
	t.is(adapterCb.callCount, 2); // after revalidate (expired)

	await delay(50);
	await http.get('/users').then(onSuccess);
	t.is(onSuccess.callCount, 7);
	t.is(adapterCb.callCount, 2); // before revalidate (expired)
	await delay(5);
	t.is(adapterCb.callCount, 3); // after revalidate (expired)
});

test('disable default cache switcher', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter),
	});

	const onSuccess = spy();
	await Promise.all([
		http.get('/users').then(onSuccess),
		http.get('/users').then(onSuccess),
		http.get('/users', { cache: false } as any).then(onSuccess),
	]);
	t.is(onSuccess.callCount, 3);
	t.is(adapterCb.callCount, 2);

});

test('request will refresh the cache with forceUpdate config', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const cache = new LRUCache<string, Cache>();
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true, cacheFlag: 'cache', defaultCache: cache }),
	});

	const onSuccess = spy();
	await http.get('/users').then(onSuccess);
	const responed1 = await (cache.get('/users') as any).responsePromise;
	await http.get('/users', { forceUpdate: true } as any).then(onSuccess);
	const responed2 = await (cache.get('/users') as any).responsePromise;
	t.is(adapterCb.callCount, 2);
	t.is(onSuccess.callCount, 2);

	if (responed1) {
		t.is(responed1.url, '/users');
		t.is(responed1.url, responed2.url);
	}

	t.not(responed1, responed2);

});

test('use a custom cache with request individual config', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter),
	});

	const cache1 = new LRUCache();
	const cache2 = new LRUCache();
	await Promise.all([http.get('/users', { cache: cache1 } as any), http.get('/users', { cache: cache2 } as any)]);
	t.is(adapterCb.callCount, 2);

	cache2.reset();
	await Promise.all([http.get('/users', { cache: cache1 } as any), http.get('/users', { cache: cache2 } as any)]);

	t.is(adapterCb.callCount, 3);
});
