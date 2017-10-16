/* eslint-disable array-element-newline */
/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-16
 */

import axios from 'axios';
import { test } from 'ava';
import { spy } from 'sinon';

import throttleAdapterEnhancer from '../throttleAdapterEnhancer';

const genMockAdapter = cb => config => {
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
		adapter: throttleAdapterEnhancer(mockedAdapter, threshold)
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
	await http.get('/users').then(onSuccess);
	t.is(onSuccess.callCount, 6);
	t.is(adapterCb.callCount, 2);

});

test('cache will be removed when request error', async t => {

	const adapterCb = spy();
	const mockedAdapter = genMockAdapter(adapterCb);
	const http = axios.create({
		adapter: throttleAdapterEnhancer(mockedAdapter)
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
