/**
 * Created by Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2018/3/19 下午11:22
 */

import { test } from 'ava';
import isCacheLike from '../isCacheLike';

test('a object with specified method will be regard as cache', t => {

	let cache = {};
	t.is(isCacheLike(cache), false);

	cache = {
		get() {
		},
		set() {
		},
		del() {
		}
	};
	t.is(isCacheLike(cache), true);
});
