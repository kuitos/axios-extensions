/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-11
 */

import LRUCache from 'lru-cache';
import buildSortedURL from './utils/buildSortedURL';

export default function throttleAdapterEnhancer(adapter, options = {}) {
	const { threshold = 1000, cacheCapacity = 10 } = options;
	const cache = new LRUCache({ max: cacheCapacity });
	const recordCacheWithRequest = (index, config) => {

		const responsePromise = (async () => {

			try {

				const response = await adapter(config);

				cache.set(index, {
					timestamp: Date.now(),
					value: Promise.resolve(response)
				});

				return response;
			} catch (reason) {
				cache.del(index);
				return Promise.reject(reason);
			}

		})();

		cache.set(index, {
			timestamp: Date.now(),
			value: responsePromise
		});

		return responsePromise;
	};

	return config => {

		const { url, method, params, paramsSerializer } = config;
		const index = buildSortedURL(url, params, paramsSerializer);

		const now = Date.now();
		const cachedRecord = cache.get(index) || { timestamp: now };

		if (method === 'get') {

			if (now - cachedRecord.timestamp <= threshold) {

				const responsePromise = cachedRecord.value;
				if (responsePromise) {

					/* istanbul ignore next */
					if (process.env.LOGGER_LEVEL === 'info') {
						// eslint-disable-next-line no-console
						console.info(`request cached by throttle adapter: ${index}`);
					}

					return responsePromise;
				}
			}

			return recordCacheWithRequest(index, config);
		}

		return adapter(config);
	};
}
