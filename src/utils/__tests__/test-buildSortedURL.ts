/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-17
 */

import { describe, expect, it } from 'vitest';
import axios from 'axios';
import { spy } from 'sinon';
import buildSortedURL from '../buildSortedURL';

describe('buildSortedURL', () => {
	it('build a simple url without params', () => {

		const url = '//cross-domain.test/users';
		const params = {};

		const builtUrl = buildSortedURL({ url, params });
		expect(builtUrl).toBe(url);
	});

	it('build a simple url with params', () => {

		const url = '//cross-domain.test/users';
		const params = { name: 'kuitos', age: 18 };

		const builtUrl = buildSortedURL({ url, params });
		expect(builtUrl).toBe(`${url}?age=18&name=kuitos`);
	});

	it('build a url which already had a query string with params', () => {

		const url = '//cross-domain.test/users?title=genius';
		const params = { name: 'kuitos', age: 18 };

		const builtUrl = buildSortedURL({ url, params });
		expect(builtUrl).toBe('//cross-domain.test/users?age=18&name=kuitos&title=genius');
	});

	it('buildSortedURL should rely on axios.Axios.prototype.getUri public API', () => {

		const originalGetUri = axios.Axios.prototype.getUri;
		const getUriSpy = spy(function (this: unknown, config?: Parameters<typeof originalGetUri>[0]) {
			return originalGetUri.call(this, config);
		});
		axios.Axios.prototype.getUri = getUriSpy;

		try {
			const url = '//cross-domain.test/users';
			const params = { name: 'kuitos', age: 18 };

			const builtUrl = buildSortedURL({ url, params });
			expect(builtUrl).toBe(`${url}?age=18&name=kuitos`);
			expect(getUriSpy.callCount).toBe(1);
			expect(getUriSpy.firstCall.args[0]).toEqual({
				url,
				baseURL: undefined,
				allowAbsoluteUrls: undefined,
				params,
				paramsSerializer: undefined,
			});
		} finally {
			axios.Axios.prototype.getUri = originalGetUri;
		}
	});

	it('should include baseURL and normalize slashes', () => {
		expect(buildSortedURL({ baseURL: 'https://a.example', url: '/users' })).toBe('https://a.example/users');
		expect(buildSortedURL({ baseURL: 'https://b.example', url: '/users' })).toBe('https://b.example/users');
		expect(buildSortedURL({ baseURL: 'https://a.example/', url: '/users' })).toBe('https://a.example/users');
	});

	it('should respect allowAbsoluteUrls when baseURL is present', () => {
		expect(buildSortedURL({
			baseURL: 'https://a.example',
			url: 'https://other.example/users',
			allowAbsoluteUrls: true,
		})).toBe('https://other.example/users');

		expect(buildSortedURL({
			baseURL: 'https://a.example',
			url: 'https://other.example/users',
			allowAbsoluteUrls: false,
		})).toBe('https://a.example/https://other.example/users');
	});

	it('should support function and object paramsSerializer', () => {
		expect(buildSortedURL({
			baseURL: 'https://a.example',
			url: '/users',
			params: { b: 2, a: [1, 3] },
			paramsSerializer: p => `z=9&a=${p.a.join(',')}&b=${p.b}`,
		})).toBe('https://a.example/users?a=1,3&b=2&z=9');

		expect(buildSortedURL({
			baseURL: 'https://a.example',
			url: '/users',
			params: { b: 2, a: [1, 3] },
			paramsSerializer: { serialize: p => `z=9&a=${p.a.join(',')}&b=${p.b}` },
		})).toBe('https://a.example/users?a=1,3&b=2&z=9');

		expect(buildSortedURL({
			baseURL: 'https://a.example',
			url: '/users',
			params: { b: 2, a: [1, 3] },
			paramsSerializer: { indexes: null },
		})).toBe('https://a.example/users?a=1&a=3&b=2');
	});

	it('should not leak global axios.defaults when omitted on config', () => {
		const prevBaseURL = axios.defaults.baseURL;
		const prevParams = axios.defaults.params;
		const prevSerializer = axios.defaults.paramsSerializer;
		const prevAllowAbsolute = axios.defaults.allowAbsoluteUrls;

		axios.defaults.baseURL = 'https://global.example';
		axios.defaults.params = { leaked: '1' };
		axios.defaults.paramsSerializer = () => 'custom=leaked';
		axios.defaults.allowAbsoluteUrls = false;

		try {
			expect(buildSortedURL({ url: '/users' })).toBe('/users');
			expect(buildSortedURL({ url: 'https://direct.example/users', baseURL: 'https://a.example' })).toBe(
				'https://direct.example/users',
			);
			expect(buildSortedURL({ url: '/users', params: { b: 2, a: 1 } })).toBe('/users?a=1&b=2');
		} finally {
			axios.defaults.baseURL = prevBaseURL;
			axios.defaults.params = prevParams;
			axios.defaults.paramsSerializer = prevSerializer;
			axios.defaults.allowAbsoluteUrls = prevAllowAbsolute;
		}
	});
});
