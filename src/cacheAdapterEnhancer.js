/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

import LRUCache from 'lru-cache';
import buildSortedURL from './utils/buildSortedURL';
import isCacheLike from './utils/isCacheLike';

const FIVE_MINUTES = 1000 * 60 * 5;

export default function cacheAdapterEnhancer(adapter, cacheEnabledByDefault = false, enableCacheFlag = 'cache', defaultLRUCache = new LRUCache({ maxAge: FIVE_MINUTES })) {

	return config => {

		const { url, method, params, paramsSerializer, forceUpdate } = config;
		const useCache = config[enableCacheFlag] !== void 0 ? config[enableCacheFlag] : cacheEnabledByDefault;

		if (method === 'get' && useCache) {

			// if had provide a specified cache, then use it instead
			const cache = isCacheLike(useCache) ? useCache : defaultLRUCache;

			// build the index according to the url and params
			const index = buildSortedURL(url, params, paramsSerializer);

			let responsePromise = cache.get(index);

			if (!responsePromise || forceUpdate) {

				responsePromise = (async () => {

					try {
						const response = await adapter(config);
						cache.set(index, Promise.resolve(response));
						return { ...response };
					} catch (reason) {
						cache.del(index);
						throw reason;
					}

				})();

				// put the promise for the non-transformed response into cache as a placeholder
				cache.set(index, responsePromise);

				return responsePromise;
			}

			/* istanbul ignore next */
			if (process.env.LOGGER_LEVEL === 'info') {
				// eslint-disable-next-line no-console
				console.info(`request cached by cache adapter: ${index}`);
			}

			return responsePromise;

		}

		return adapter(config);
	};
}
