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

		const builtUrl = buildSortedURL(url, params);
		expect(builtUrl).toBe(url);
	});

	it('build a simple url with params', () => {

		const url = '//cross-domain.test/users';
		const params = { name: 'kuitos', age: 18 };

		const builtUrl = buildSortedURL(url, params);
		expect(builtUrl).toBe(`${url}?age=18&name=kuitos`);
	});

	it('build a url which already had a query string with params', () => {

		const url = '//cross-domain.test/users?title=genius';
		const params = { name: 'kuitos', age: 18 };

		const builtUrl = buildSortedURL(url, params);
		expect(builtUrl).toBe('//cross-domain.test/users?age=18&name=kuitos&title=genius');
	});

	it('buildSortedURL should rely on axios.getUri public API', () => {

		const originalGetUri = axios.getUri;
		const getUriSpy = spy((config: Parameters<typeof originalGetUri>[0]) => originalGetUri(config));
		axios.getUri = getUriSpy;

		try {
			const url = '//cross-domain.test/users';
			const params = { name: 'kuitos', age: 18 };

			const builtUrl = buildSortedURL(url, params);
			expect(builtUrl).toBe(`${url}?age=18&name=kuitos`);
			expect(getUriSpy.callCount).toBe(1);
			expect(getUriSpy.firstCall.args[0]).toEqual({ url, params, paramsSerializer: undefined });
		} finally {
			axios.getUri = originalGetUri;
		}
	});
});
