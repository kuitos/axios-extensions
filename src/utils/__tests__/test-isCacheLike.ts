/**
 * Created by Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2018/3/19 下午11:22
 */

import test from 'ava';
import isCacheLike from '../isCacheLike';

test('a object with specified method will be regard as cache', t => {
	t.is(isCacheLike(null), false);
	t.is(isCacheLike(void 0), false);
	t.is(isCacheLike(1), false);

	let cache = {};
	t.is(isCacheLike(cache), false);

	cache = {
		get() {},
		set() {},
		delete() {},
	};
	t.is(isCacheLike(cache), true);

	// Test backward compat: object with del() should also be accepted
	cache = {
		get() {},
		set() {},
		del() {},
	};
	t.is(isCacheLike(cache), true);

	// Test that object with neither del() nor delete() is rejected
	cache = {
		get() {},
		set() {},
	};
	t.is(isCacheLike(cache), false);
});
