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
	cacheable?: (config: AxiosRequestConfig) => boolean | ICacheLike<any>,
	keyGenerator?: (config: AxiosRequestConfig) => string,
	defaultCache?: ICacheLike<AxiosPromise>,
};

function defaultCacheable(config: AxiosRequestConfig): boolean | ICacheLike<any> {
	if (config.cache !== undefined && config.cache !== null) return config.cache;
	return config.method === 'get';
}

export default function cacheAdapterEnhancer(adapter: NonNullable<AxiosRequestConfig['adapter']>, options: Options = {}): AxiosAdapter {

	const resolvedAdapter = resolveAdapter(adapter);

	const {
		cacheable = defaultCacheable,
		keyGenerator,
		defaultCache = new Cache<AxiosPromise>({ ttl: FIVE_MINUTES, max: CAPACITY }),
	} = options;

	return config => {

		const { url, params, paramsSerializer, forceUpdate } = config;
		const result = cacheable(config);

		if (result) {

			const cache: ICacheLike<AxiosPromise> = isCacheLike(result) ? result : defaultCache;
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
