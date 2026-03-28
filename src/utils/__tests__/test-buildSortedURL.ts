/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-17
 */

import test from 'ava';
import axios from 'axios';
import { spy } from 'sinon';
import buildSortedURL from '../buildSortedURL';

test('build a simple url without params', t => {

	const url = '//cross-domain.test/users';
	const params = {};

	const builtUrl = buildSortedURL(url, params);
	t.is(builtUrl, `${url}`);
});

test('build a simple url with params', t => {

	const url = '//cross-domain.test/users';
	const params = { name: 'kuitos', age: 18 };

	const builtUrl = buildSortedURL(url, params);
	t.is(builtUrl, `${url}?age=18&name=kuitos`);
});

test('build a url which already had a query string with params', t => {

	const url = '//cross-domain.test/users?title=genius';
	const params = { name: 'kuitos', age: 18 };

	const builtUrl = buildSortedURL(url, params);
	t.is(builtUrl, '//cross-domain.test/users?age=18&name=kuitos&title=genius');
});

test('buildSortedURL should rely on axios.getUri public API', t => {

	const originalGetUri = axios.getUri;
	const getUriSpy = spy((config: Parameters<typeof originalGetUri>[0]) => originalGetUri(config));
	axios.getUri = getUriSpy;

	try {
		const url = '//cross-domain.test/users';
		const params = { name: 'kuitos', age: 18 };

		const builtUrl = buildSortedURL(url, params);
		t.is(builtUrl, `${url}?age=18&name=kuitos`);
		t.is(getUriSpy.callCount, 1);
		t.deepEqual(getUriSpy.firstCall.args[0], { url, params, paramsSerializer: undefined });
	} finally {
		axios.getUri = originalGetUri;
	}
});
