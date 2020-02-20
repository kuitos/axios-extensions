/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-09-28
 */

import Cache from 'lru-cache';
import cacheAdapterEnhancer, { ICacheLike } from './cacheAdapterEnhancer';
import retryAdapterEnhancer from './retryAdapterEnhancer';
import throttleAdapterEnhancer from './throttleAdapterEnhancer';

export {
	Cache,
	ICacheLike,
	cacheAdapterEnhancer,
	throttleAdapterEnhancer,
	retryAdapterEnhancer,
};
