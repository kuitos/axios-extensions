/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

import LRUCache from 'lru-cache';
import buildUrl from './utils/buildUrl';

const FIVE_MINUTES = 1000 * 60 * 5;

export default function cacheAdapterEnhancer(adapter, cacheEnabledByDefault = true, enableCacheFlag = 'cache', cacheAge = FIVE_MINUTES) {

	const cache = new LRUCache({ maxAge: cacheAge });

	return config => {

		const { url, method, params } = config;

		// 以 url 跟 params 建立索引
		const index = buildUrl(url, params);
		const useCache = config[enableCacheFlag] !== void 0 ? config[enableCacheFlag] : cacheEnabledByDefault;

		if (method === 'get' && useCache) {

			let responsePromise = cache.get(index);

			if (!responsePromise) {

				responsePromise = (async () => {

					try {
						const response = await adapter(config);
						cache.set(index, Promise.resolve(response));
						return { ...response };
					} catch (reason) {
						cache.del(index);
						return Promise.reject(reason);
					}

				})();

				// put the promise for the non-transformed response into cache as a placeholder
				cache.set(index, responsePromise);

				return responsePromise;
			}

			/* istanbul ignore next */
			if (process.env.NODE_ENV !== 'production') {
				// eslint-disable-next-line no-console
				console.log(`request via cache adapter: ${index}`);
			}

			return responsePromise;

		}

		return adapter(config);
	};
}
