/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-16
 */

import test from 'ava';
import axios from 'axios';
import LRUCache from 'lru-cache';
import { spy } from 'sinon';

import throttleAdapterEnhancer, { RecordedCache } from '../throttleAdapterEnhancer';

const genMockAdapter = (cb: any) => (config: any) => {
	cb();
	if (config.error) {
		return Promise.reject(config);
	}
	return Promise.resolve(config);
};

test('throttle adapter should cache request in a threshold seconds', async t => {

	const threshold = 1000;
	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: throttleAdapterEnhancer(mockedAdapter, { threshold }),
	});

	const onSuccess = spy();
	const promises = [];

	const start = Date.now();
	for (let i = 0; i < 5; i++) {
		promises.push(http.get('/users').then(onSuccess));
	}

	await Promise.all(promises);
	const end = Date.now();
	t.is(onSuccess.callCount, 5);
	t.is(adapterCb.callCount, 1);
	t.is(adapterCb.calledBefore(onSuccess), true);
	t.is(end - start < threshold, true);

	await new Promise(r => setTimeout(r, threshold));
	await Promise.all([
		http.get('/users').then(onSuccess),
		http.get('/users').then(onSuccess),
	]);
	t.is(onSuccess.callCount, 7);
	t.is(adapterCb.callCount, 2);

});

test('throttle adapter shouldn`t do anything when a non-get request invoked', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: throttleAdapterEnhancer(mockedAdapter),
	});

	const onSuccess = spy();
	await Promise.all([
		http.post('/users').then(onSuccess),
		http.post('/users').then(onSuccess),
	]);
	t.is(onSuccess.callCount, 2);
	t.is(adapterCb.callCount, 2);

});

test('cache will be removed when request error', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: throttleAdapterEnhancer(mockedAdapter),
	});

	const onSuccess = spy();
	const onError = spy();
	await Promise.all([
		http.get('/users', { error: true } as any).then(onSuccess, onError),
		http.get('/users').then(onSuccess, onError),
	]);
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

test('use a custom cache for throttle enhancer', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const cache = new LRUCache<string, RecordedCache>({ max: 100 });
	const http = axios.create({
		adapter: throttleAdapterEnhancer(mockedAdapter, { cache }),
	});

	const onSuccess = spy();
	await Promise.all([
		http.get('/users').then(onSuccess),
		http.get('/users').then(onSuccess),
	]);
	t.is(onSuccess.callCount, 2);
	t.is(adapterCb.callCount, 1);

	cache.delete('/users');
	await Promise.all([
		http.get('/users').then(onSuccess),
		http.get('/users').then(onSuccess),
	]);
	t.is(onSuccess.callCount, 4);
	t.is(adapterCb.callCount, 2);
});
