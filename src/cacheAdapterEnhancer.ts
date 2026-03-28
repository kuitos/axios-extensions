/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

import { AxiosAdapter, AxiosPromise, AxiosRequestConfig } from 'axios';
import { LRUCache } from 'lru-cache';
import buildSortedURL from './utils/buildSortedURL';
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
		defaultCache = new LRUCache<string, AxiosPromise>({ ttl: FIVE_MINUTES, max: CAPACITY }),
		keyGenerator,
	} = options;

	return config => {

		const { url, method, params, paramsSerializer, forceUpdate } = config;
		const useCache = ((config as any)[cacheFlag] !== void 0 && (config as any)[cacheFlag] !== null)
			? (config as any)[cacheFlag]
			: enabledByDefault;

		if (method === 'get' && useCache) {

			// if had provided a specified cache, then use it instead
			const cache: ICacheLike<AxiosPromise> = isCacheLike(useCache) ? useCache : defaultCache;

			const index = keyGenerator ? keyGenerator(config) : buildSortedURL(url, params, paramsSerializer);

			let responsePromise = cache.get(index);

			if (!responsePromise || forceUpdate) {

				responsePromise = (async () => {

					try {
						return await resolvedAdapter(config);
					} catch (reason) {
						if ('delete' in cache) {
							cache.delete(index);
						} else {
							(cache as any).del(index);
						}
						throw reason;
					}

				})();

				// put the promise for the non-transformed response into cache as a placeholder
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
