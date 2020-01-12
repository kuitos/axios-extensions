/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-09-28
 */

import Cache from 'lru-cache';
import cacheAdapterEnhancer from './cacheAdapterEnhancer';
import throttleAdapterEnhancer from './throttleAdapterEnhancer';
import buildSortedURL from './utils/buildSortedURL';
import isCacheLike from './utils/isCacheLike';

export {
	Cache,
	cacheAdapterEnhancer,
	throttleAdapterEnhancer,
	utils: {
		buildSortedURL,
		isCacheLike,
	},
};
