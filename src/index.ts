/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-09-28
 */

import Cache from './Cache';
import cacheAdapterEnhancer from './cacheAdapterEnhancer';
import retryAdapterEnhancer from './retryAdapterEnhancer';
import throttleAdapterEnhancer from './throttleAdapterEnhancer';
import type { ICacheLike } from './utils/isCacheLike';

export {
	Cache,
	cacheAdapterEnhancer,
	throttleAdapterEnhancer,
	retryAdapterEnhancer,
};

export type { ICacheLike };
