/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-09-28
 */

import Cache from 'lru-cache';
import cacheAdapterEnhancer, { ICacheLike } from './cacheAdapterEnhancer';
import retryAdapterEnhancer from './retryAdapterEnhancer';
import throttleAdapterEnhancer from './throttleAdapterEnhancer';
import AdapterBuilder from './utils/AdapterBuilder';

export {
	Cache,
	ICacheLike,
	AdapterBuilder,
	cacheAdapterEnhancer,
	throttleAdapterEnhancer,
	retryAdapterEnhancer,
};
