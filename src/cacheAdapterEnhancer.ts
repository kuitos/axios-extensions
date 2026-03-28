/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

import { AxiosAdapter, AxiosPromise, AxiosRequestConfig } from 'axios';
import Cache from './Cache';
import buildSortedURL from './utils/buildSortedURL';
import deleteCacheEntry from './utils/deleteCacheEntry';
import isCacheLike, { ICacheLike } from './utils/isCacheLike';
import resolveAdapter from './utils/resolveAdapter';
import shouldLogInfo from './utils/shouldLogInfo';

declare module 'axios' {
	interface AxiosRequestConfig {
		forceUpdate?: boolean;
		cache?: boolean | ICacheLike<any>;
	}
}

const FIVE_MINUTES = 1000 * 60 * 5;
const CAPACITY = 100;

export type Options = {
	enabledByDefault?: boolean,
	cacheFlag?: string,
	defaultCache?: ICacheLike<AxiosPromise>,
	keyGenerator?: (config: AxiosRequestConfig) => string,
};

export default function cacheAdapterEnhancer(adapter: NonNullable<AxiosRequestConfig['adapter']>, options: Options = {}): AxiosAdapter {

	const resolvedAdapter = resolveAdapter(adapter);

	const {
		enabledByDefault = true,
		cacheFlag = 'cache',
		defaultCache = new Cache<AxiosPromise>({ ttl: FIVE_MINUTES, max: CAPACITY }),
		keyGenerator,
	} = options;

	return config => {

		const { url, method, params, paramsSerializer, forceUpdate } = config;
		const requestConfig = config as AxiosRequestConfig & Record<string, unknown>;
		const cacheValue = requestConfig[cacheFlag];
		const useCache = (cacheValue !== void 0 && cacheValue !== null)
			? cacheValue
			: enabledByDefault;

		if (method === 'get' && useCache) {

			const cache: ICacheLike<AxiosPromise> = isCacheLike(useCache) ? useCache : defaultCache;
			const index = keyGenerator ? keyGenerator(config) : buildSortedURL(url, params, paramsSerializer);

			let responsePromise = cache.get(index);

			if (!responsePromise || forceUpdate) {

				responsePromise = (async () => {

					try {
						return await resolvedAdapter(config);
					} catch (reason) {
						deleteCacheEntry(cache, index);
						throw reason;
					}

				})();

				cache.set(index, responsePromise);

				return responsePromise;
			}

			/* istanbul ignore next */
			if (shouldLogInfo()) {
				console.info(`[axios-extensions] request cached by cache adapter --> url: ${index}`);
			}

			return responsePromise;
		}

		return resolvedAdapter(config);
	};
}
