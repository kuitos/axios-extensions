/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-11
 */

import LRUCache from 'lru-cache';
import buildUrl from './utils/buildUrl';

export default function throttleAdapterEnhancer(adapter, threshold = 1000, cacheCapacity = 10) {

	const cache = new LRUCache({ max: cacheCapacity });

	return config => {

		const { url, method, params } = config;
		const index = buildUrl(url, params);

		const now = Date.now();
		const cachedRecord = cache.get(index) || { timestamp: now };

		if (method === 'get' && now - cachedRecord.timestamp <= threshold) {

			let responsePromise = cachedRecord.value;

			if (!responsePromise) {

				responsePromise = (async () => {

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
			}

			return responsePromise;
		}

		return adapter(config);
	};
}
