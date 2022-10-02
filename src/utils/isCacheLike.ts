/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2018-03-19
 */
import { ICacheLike } from './getDefaultLruCache';

export default function isCacheLike(cache: any): cache is ICacheLike<any> {
	return typeof cache.get === 'function' && typeof cache.set === 'function' && typeof cache.del === 'function';
}
