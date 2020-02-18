/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

import { AxiosAdapter, AxiosPromise } from 'axios';
import LRUCache from 'lru-cache';
import buildSortedURL from './utils/buildSortedURL';
import isCacheLike from './utils/isCacheLike';

const FIVE_MINUTES = 1000 * 60 * 5;
const CAPACITY = 100;

export interface ICacheLike<T> {
	get(key: string): T | undefined;

	set(key: string, value: T, maxAge?: number): boolean;

	del(key: string): void;
}

export type Options = {
	enabledByDefault?: boolean,
	cacheFlag?: string,
	defaultCache?: ICacheLike<AxiosPromise>,
};

export default function cacheAdapterEnhancer(adapter: AxiosAdapter, options: Options = {}): AxiosAdapter {

	const {
		enabledByDefault = true,
		cacheFlag = 'cache',
		defaultCache = new LRUCache<string, AxiosPromise>({ maxAge: FIVE_MINUTES, max: CAPACITY }),
	} = options;

	return config => {

		const { url, method, params, paramsSerializer, forceUpdate } = config;
		const useCache = (config[cacheFlag] !== void 0 && config[cacheFlag] !== null) ? config[cacheFlag] : enabledByDefault;

		if (method === 'get' && useCache) {

			// if had provide a specified cache, then use it instead
			const cache: ICacheLike<AxiosPromise> = isCacheLike(useCache) ? useCache : defaultCache;

			// build the index according to the url and params
			const index = buildSortedURL(url, params, paramsSerializer);

			let responsePromise = cache.get(index);

			if (!responsePromise || forceUpdate) {

				responsePromise = (async () => {

					try {
						return await adapter(config);
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
			if (process.env.NODE_ENV === 'development' || process.env.LOGGER_LEVEL === 'info') {
				// eslint-disable-next-line no-console
				console.info(`request cached by cache adapter: ${index}`);
			}

			return responsePromise;
		}

		return adapter(config);
	};
}
