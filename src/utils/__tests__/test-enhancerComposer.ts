import { test } from 'ava';
import axios from 'axios';
import { spy } from 'sinon';

import cacheAdapterEnhancer from '../../cacheAdapterEnhancer';
import retryAdapterEnhancer from '../../retryAdapterEnhancer';
import throttleAdapterEnhancer from '../../throttleAdapterEnhancer';
import enhancerComposer from '../enhancerComposer';

test('adapter must perform normal operation of all enhancers', async t => {

	let currentTest: 'retry' | 'cache' | 'throttle' = 'retry';

	const retrySpy = spy();
	const cacheSpy = spy();
	const throttleSpy = spy();

	const retryTimes = 3;
	const throttleThreshold = 1000;

	const mockedAdapter = (config: any) => {
		if (currentTest === 'retry') {
			retrySpy();
			if (retrySpy.callCount === retryTimes + 1) {
				return Promise.resolve(config);
			}
			return Promise.reject(config);
		}

		if (currentTest === 'throttle') {
			throttleSpy();
		}

		if (currentTest === 'cache') {
			cacheSpy();
		}

		if (config.error) {
			return Promise.reject(config);
		}

		return Promise.resolve(config);
	};

	const http = axios.create({
		adapter: enhancerComposer(retryAdapterEnhancer, throttleAdapterEnhancer, cacheAdapterEnhancer)(mockedAdapter, {
			times: retryTimes,
			threshold: throttleThreshold,
			enabledByDefault: true,
		}),
	});

	// retry test
	currentTest = 'retry';

	await http.get('/retry');

	t.is(retrySpy.callCount, retryTimes + 1);

	// throttle test
	currentTest = 'throttle';

	const throttleOnSuccess = spy();
	const throttlePromises = [];

	const start = Date.now();
	for (let i = 0; i < 5; i++) {
		throttlePromises.push(http.get('/throttle', { cache: false }).then(throttleOnSuccess));
	}

	await Promise.all(throttlePromises);
	const end = Date.now();
	t.is(throttleOnSuccess.callCount, 5);
	t.is(throttleSpy.callCount, 1);
	t.is(throttleSpy.calledBefore(throttleOnSuccess), true);
	t.is(end - start < throttleThreshold, true);

	await new Promise(r => setTimeout(r, throttleThreshold));
	await Promise.all([
		http.get('/throttle', { cache: false }).then(throttleOnSuccess),
		http.get('/throttle', { cache: false }).then(throttleOnSuccess),
	]);
	t.is(throttleOnSuccess.callCount, 7);
	t.is(throttleSpy.callCount, 2);

	// cache test
	currentTest = 'cache';

	const cacheOnSuccess = spy();
	const cachePromises = [];

	for (let i = 0; i < 5; i++) {
		cachePromises.push(http.get('/cache').then(cacheOnSuccess));
	}

	await Promise.all(cachePromises);

	t.is(cacheOnSuccess.callCount, 5);
	t.is(cacheSpy.callCount, 1);
	t.is(cacheSpy.calledBefore(cacheOnSuccess), true);

	await http.get('/cache', { params: { value: 'item' } }).then(cacheOnSuccess);
	t.is(cacheOnSuccess.callCount, 6);
	t.is(cacheSpy.callCount, 2);

	await http.get('/cache', { params: { value: 'item' }, cache: true } as any).then(cacheOnSuccess);
	t.is(cacheOnSuccess.callCount, 7);
	t.is(cacheSpy.callCount, 2);

});
