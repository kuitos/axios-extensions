/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-09-28
 */

import LRUCache from 'lru-cache';
import cacheAdapterEnhancer from './cacheAdapterEnhancer';
import retryAdapterEnhancer from './retryAdapterEnhancer';
import throttleAdapterEnhancer from './throttleAdapterEnhancer';
import { ICacheLike } from './utils/getDefaultLruCache';

class Cache<K, V> extends LRUCache<K, V> {
	constructor(options: LRUCache.Options<any, any>) {
		super(options);
	}

	del(key: K): boolean {
		return super.delete(key);
	}
}

export {
	Cache,
	ICacheLike,
	cacheAdapterEnhancer,
	throttleAdapterEnhancer,
	retryAdapterEnhancer,
};
