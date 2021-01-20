/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-17
 */

import test from 'ava';
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
