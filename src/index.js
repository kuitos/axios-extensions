/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-09-28
 */

import Cache from 'lru-cache';
import cacheAdapterEnhancer, { defaultCache } from './cacheAdapterEnhancer';
import throttleAdapterEnhancer from './throttleAdapterEnhancer';

export {
	Cache,
	defaultCache,
	cacheAdapterEnhancer,
	throttleAdapterEnhancer
};
