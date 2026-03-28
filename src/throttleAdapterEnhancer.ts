/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-11
 */

import { AxiosAdapter, AxiosPromise, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { LRUCache } from 'lru-cache';
import buildSortedURL from './utils/buildSortedURL';
import { ICacheLike } from './utils/isCacheLike';
import resolveAdapter from './utils/resolveAdapter';

export type RecordedCache = {
	timestamp: number;
	value?: AxiosPromise;
};

export type Options = {
	threshold?: number,
	cache?: ICacheLike<RecordedCache>,
};

export default function throttleAdapterEnhancer(adapter: NonNullable<AxiosRequestConfig['adapter']>, options: Options = {}): AxiosAdapter {

	const resolvedAdapter = resolveAdapter(adapter);

	const { threshold = 1000, cache = new LRUCache<string, RecordedCache>({ max: 10 }) } = options;

	const recordCacheWithRequest = (index: string, config: InternalAxiosRequestConfig) => {

		const responsePromise = (async () => {

			try {
				const response = await resolvedAdapter(config);

				cache.set(index, {
					timestamp: Date.now(),
					value: Promise.resolve(response),
				});

				return response;
			} catch (reason) {
				if ('delete' in cache) {
					cache.delete(index);
				} else {
					(cache as any).del(index);
				}
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
						console.info(`[axios-extensions] request cached by throttle adapter --> url: ${index}`);
					}

					return responsePromise;
				}
			}

			return recordCacheWithRequest(index, config);
		}

		return resolvedAdapter(config);
	};
}
