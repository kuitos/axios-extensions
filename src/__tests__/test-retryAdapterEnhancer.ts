/**
 * @author Kuitos
 * @since 2020-02-18
 */

import test from 'ava';
import axios from 'axios';
import { spy } from 'sinon';
import retryAdapterEnhancer from '../retryAdapterEnhancer';

test('should retry the request with special times while request failed', async (t) => {

	const times = 3;
	const spyFn = spy();
	const mockedAdapter = (config: any) => {
		spyFn();
		if (spyFn.callCount === times + 1) {
			return Promise.resolve(config);
		}
		return Promise.reject(config);
	};
	const http = axios.create({
		adapter: retryAdapterEnhancer(mockedAdapter, { times }),
	});

	await http.get('/test');

	t.is(spyFn.callCount, times + 1);
});

test('should return the result immediately while the request succeed', async (t) => {
	const spyFn = spy();
	const mockedAdapter = (config: any) => {
		spyFn();
		if (spyFn.calledTwice) {
			return Promise.resolve(config);
		}

		return Promise.reject(config);
	};
	const http = axios.create({
		adapter: retryAdapterEnhancer(mockedAdapter),
	});

	await http.get('/test');

	t.truthy(spyFn.calledTwice);
});

test('should throw an exception while request still failed after retry', async (t) => {

	const defaultTimes = 2;
	const spyFn = spy();
	const mockedAdapter = (config: any) => {
		spyFn();
		return Promise.reject(config);
	};
	const http = axios.create({
		adapter: retryAdapterEnhancer(mockedAdapter),
	});

	try {
		await http.get('/test');
	} catch (e: any) {
		t.is(e.url, '/test');
		t.is(spyFn.callCount, defaultTimes + 1);
	}
});

test('should retry with special times for the custom config request', async (t) => {

	const spyFn = spy();
	const mockedAdapter = (config: any) => {
		spyFn();
		return Promise.reject(config);
	};
	const http = axios.create({
		adapter: retryAdapterEnhancer(mockedAdapter, { times: 2 }),
	});

	const customRetryTimes = 4;
	try {
		await http.get('/test', { retryTimes: customRetryTimes });
	} catch (e: any) {
		t.is(e.url, '/test');
		t.is(spyFn.callCount, customRetryTimes + 1);
	}
});
