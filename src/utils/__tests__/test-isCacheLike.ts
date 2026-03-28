/**
 * Created by Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2018/3/19 下午11:22
 */

import { expect, it } from 'vitest';
import isCacheLike from '../isCacheLike';

it('a object with specified method will be regard as cache', () => {
	expect(isCacheLike(null)).toBe(false);
	expect(isCacheLike(void 0)).toBe(false);
	expect(isCacheLike(1)).toBe(false);

	let cache = {};
	expect(isCacheLike(cache)).toBe(false);

	cache = {
		get() {},
		set() {},
		delete() {},
	};
	expect(isCacheLike(cache)).toBe(true);

	// Test backward compat: object with del() should also be accepted
	cache = {
		get() {},
		set() {},
		del() {},
	};
	expect(isCacheLike(cache)).toBe(true);

	// Test that object with neither del() nor delete() is rejected
	cache = {
		get() {},
		set() {},
	};
	expect(isCacheLike(cache)).toBe(false);
});
