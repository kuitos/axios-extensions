/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-11
 */

import { AxiosAdapter, AxiosPromise, AxiosRequestConfig } from 'axios';
import buildSortedURL from './utils/buildSortedURL';
import getDefaultLruCache, { ICacheLike } from './utils/getDefaultLruCache';

export type RecordedCache = {
	timestamp: number;
	value?: AxiosPromise;
};

export type Options = {
	threshold?: number,
	cache?: ICacheLike<RecordedCache>,
};

export default function throttleAdapterEnhancer(adapter: AxiosAdapter, options: Options = {}): AxiosAdapter {

	const { threshold = 1000, cache = getDefaultLruCache<RecordedCache>({ max: 10 }) } = options;

	const recordCacheWithRequest = (index: string, config: AxiosRequestConfig) => {

		const responsePromise = (async () => {

			try {

				const response = await adapter(config);

				cache.set(index, {
					timestamp: Date.now(),
					value: Promise.resolve(response),
				});

				return response;
			} catch (reason) {
				cache.del(index);
				throw reason;
			}

		})();

		cache.set(index, {
			timestamp: Date.now(),
			value: responsePromise,
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
						console.info(`[axios-extensions] request cached by throttle adapter --> url: ${index}`);
					}

					return responsePromise;
				}
			}

			return recordCacheWithRequest(index, config);
		}

		return adapter(config);
	};
}
