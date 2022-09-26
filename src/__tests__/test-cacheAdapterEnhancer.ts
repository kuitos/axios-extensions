/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-16
 */

import test from 'ava';
import axios, { AxiosPromise } from 'axios';
import LRUCache from 'lru-cache';
import { spy } from 'sinon';

import cacheAdapterEnhancer from '../cacheAdapterEnhancer';

// mock the actual request
const genMockAdapter = (cb: any) => (config: any) => {
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
	const cache = new LRUCache<string, AxiosPromise>({ max: 100 });
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter, { enabledByDefault: true, cacheFlag: 'cache', defaultCache: cache }),
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

test('use a custom cache with request individual config', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter),
	});

	const cache1 = new LRUCache({ max: 100 });
	const cache2 = new LRUCache({ max: 100 });
	await Promise.all([http.get('/users', { cache: cache1 } as any), http.get('/users', { cache: cache2 } as any)]);
	t.is(adapterCb.callCount, 2);

	cache2.clear();
	await Promise.all([http.get('/users', { cache: cache1 } as any), http.get('/users', { cache: cache2 } as any)]);

	t.is(adapterCb.callCount, 3);
});
