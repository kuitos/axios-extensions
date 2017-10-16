/* eslint-disable array-element-newline */
/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-16
 */

import axios from 'axios';
import { test } from 'ava';
import { spy } from 'sinon';

import cacheAdapterEnhancer from '../cacheAdapterEnhancer';

const genMockAdapter = cb => config => {
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
		adapter: cacheAdapterEnhancer(mockedAdapter)
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

	await http.get('/users', { params: { name: 'kuitos' }, cache: true }).then(onSuccess);
	t.is(onSuccess.callCount, 7);
	t.is(adapterCb.callCount, 2);

});

test('cache adapter shouldn`t cache request with noCacheFlag', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter, 'cache')
	});

	const onSuccess = spy();
	await Promise.all([http.get('/users', { cache: false }).then(onSuccess), http.get('/users', { cache: false }).then(onSuccess)]);
	t.is(onSuccess.callCount, 2);
	t.is(adapterCb.callCount, 2);

});

test('cache will be removed when request error', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: cacheAdapterEnhancer(mockedAdapter)
	});

	const onSuccess = spy();
	const onError = spy();
	await Promise.all([
		http.get('/users', { error: true }).then(onSuccess, onError),
		http.get('/users').then(onSuccess, onError)
	]);
	t.is(onSuccess.callCount, 0);
	t.is(onError.callCount, 2);
	t.is(adapterCb.callCount, 1);

	await Promise.all([
		http.get('/users').then(onSuccess, onError),
		http.get('/users').then(onSuccess, onError)
	]);
	t.is(onSuccess.callCount, 2);
	t.is(adapterCb.callCount, 2);

});

