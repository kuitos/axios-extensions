import axios from 'axios';
import { spy } from 'sinon';
import { describe, expect, it } from 'vitest';

import Cache from '../Cache';
import genMockAdapter from '../testUtils/mockAdapter';
import throttleAdapterEnhancer, { RecordedCache } from '../throttleAdapterEnhancer';

describe('throttleAdapterEnhancer', () => {
	it('throttle adapter should cache request in a threshold seconds', async () => {

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
		expect(onSuccess.callCount).toBe(5);
		expect(adapterCb.callCount).toBe(1);
		expect(adapterCb.calledBefore(onSuccess)).toBe(true);
		expect(end - start < threshold).toBe(true);

		await new Promise(r => setTimeout(r, threshold + 50));
		await Promise.all([
			http.get('/users').then(onSuccess),
			http.get('/users').then(onSuccess),
		]);
		expect(onSuccess.callCount).toBe(7);
		expect(adapterCb.callCount).toBe(2);
	});

	it('throttle adapter shouldn`t do anything when a non-get request invoked', async () => {

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
		expect(onSuccess.callCount).toBe(2);
		expect(adapterCb.callCount).toBe(2);
	});

	it('cache will be removed when request error', async () => {

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

	it('should use per-request threshold to override global threshold', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: throttleAdapterEnhancer(mockedAdapter, { threshold: 1000 }),
		});

		await http.get('/users', { threshold: 100 });
		await http.get('/users', { threshold: 100 });
		expect(adapterCb.callCount).toBe(1);

		await new Promise(r => setTimeout(r, 150));
		await http.get('/users', { threshold: 100 });
		expect(adapterCb.callCount).toBe(2);
	});

	it('should fallback to global threshold when per-request threshold is not set', async () => {

		const globalThreshold = 200;
		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const http = axios.create({
			adapter: throttleAdapterEnhancer(mockedAdapter, { threshold: globalThreshold }),
		});

		await http.get('/users');
		await new Promise(r => setTimeout(r, 100));
		await http.get('/users');
		expect(adapterCb.callCount).toBe(1);

		await new Promise(r => setTimeout(r, globalThreshold));
		await http.get('/users');
		expect(adapterCb.callCount).toBe(2);
	});

	it('use a custom cache for throttle enhancer', async () => {

		const adapterCb = spy();
		const mockedAdapter = genMockAdapter(adapterCb);
		const cache = new Cache<RecordedCache>({ max: 100 });
		const http = axios.create({
			adapter: throttleAdapterEnhancer(mockedAdapter, { cache }),
		});

		const onSuccess = spy();
		await Promise.all([
			http.get('/users').then(onSuccess),
			http.get('/users').then(onSuccess),
		]);
		expect(onSuccess.callCount).toBe(2);
		expect(adapterCb.callCount).toBe(1);

		cache.delete('/users');
		await Promise.all([
			http.get('/users').then(onSuccess),
			http.get('/users').then(onSuccess),
		]);
		expect(onSuccess.callCount).toBe(4);
		expect(adapterCb.callCount).toBe(2);
	});

	it('throttle adapter should resolve adapter names via axios.getAdapter', async () => {

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
				adapter: throttleAdapterEnhancer(adapterName),
			});

			await http.get('/users');

			expect(getAdapterSpy.callCount).toBe(1);
			expect(adapterCb.callCount).toBe(1);
		} finally {
			axios.getAdapter = originalGetAdapter;
		}
	});

	it('throttle adapter should not throw when process is undefined', async () => {

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
				adapter: throttleAdapterEnhancer(mockedAdapter, { threshold: 1000 }),
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
});
