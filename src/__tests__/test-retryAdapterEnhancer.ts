/**
 * @author Kuitos
 * @since 2020-02-18
 */

import { describe, expect, it } from 'vitest';
import axios from 'axios';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import retryAdapterEnhancer from '../retryAdapterEnhancer';

function createEventuallySuccessAdapter(spyFn: SinonSpy, succeedAt: number) {
	return function mockedAdapter(config: any) {
		spyFn();
		if (spyFn.callCount >= succeedAt) {
			return Promise.resolve(config);
		}

		return Promise.reject(config);
	};
}

function createAlwaysFailAdapter(spyFn: SinonSpy) {
	return function mockedAdapter(config: any) {
		spyFn();
		return Promise.reject(config);
	};
}

describe('retryAdapterEnhancer', () => {
	it('should retry the request with special times while request failed', async () => {

		const times = 3;
		const spyFn = spy();
		const mockedAdapter = createEventuallySuccessAdapter(spyFn, times + 1);
		const http = axios.create({
			adapter: retryAdapterEnhancer(mockedAdapter, { times }),
		});

		await http.get('/test');

		expect(spyFn.callCount).toBe(times + 1);
	});

	it('should return the result immediately while the request succeed', async () => {
		const spyFn = spy();
		const mockedAdapter = createEventuallySuccessAdapter(spyFn, 2);
		const http = axios.create({
			adapter: retryAdapterEnhancer(mockedAdapter),
		});

		await http.get('/test');

		expect(spyFn.calledTwice).toBeTruthy();
	});

	it('should throw an exception while request still failed after retry', async () => {

		const defaultTimes = 2;
		const spyFn = spy();
		const mockedAdapter = createAlwaysFailAdapter(spyFn);
		const http = axios.create({
			adapter: retryAdapterEnhancer(mockedAdapter),
		});

		await expect(http.get('/test')).rejects.toMatchObject({
			url: '/test',
		});
		expect(spyFn.callCount).toBe(defaultTimes + 1);
	});

	it('should retry with special times for the custom config request', async () => {

		const spyFn = spy();
		const mockedAdapter = createAlwaysFailAdapter(spyFn);
		const http = axios.create({
			adapter: retryAdapterEnhancer(mockedAdapter, { times: 2 }),
		});

		const customRetryTimes = 4;
		await expect(http.get('/test', { retryTimes: customRetryTimes })).rejects.toMatchObject({
			url: '/test',
		});
		expect(spyFn.callCount).toBe(customRetryTimes + 1);
	});

	it('should not throw ReferenceError when process is undefined', async () => {

		const originalProcess = process;

		Object.defineProperty(globalThis, 'process', {
			value: undefined,
			configurable: true,
			writable: true,
		});

		const spyFn = spy();
		const mockedAdapter = createEventuallySuccessAdapter(spyFn, 2);

		try {
			const http = axios.create({
				adapter: retryAdapterEnhancer(mockedAdapter),
			});

			await http.get('/test');

			expect(spyFn.calledTwice).toBeTruthy();
		} finally {
			Object.defineProperty(globalThis, 'process', {
				value: originalProcess,
				configurable: true,
				writable: true,
			});
		}
	});
});
