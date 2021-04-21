/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

import { AxiosAdapter, AxiosPromise } from 'axios';
import LRUCache from 'lru-cache';
import { ICacheLike } from './cacheAdapterEnhancer';
import buildSortedURL from './utils/buildSortedURL';
import isCacheLike from './utils/isCacheLike';

declare module 'axios' {
	interface AxiosRequestConfig {
		forceUpdate?: boolean;
		forceRevalidate?: boolean;
		cache?: boolean | ICacheLike<any>;
		revalidate?: boolean | number;
	}
}

const FIVE_MINUTES = 1000 * 60 * 5;
const CAPACITY = 100;

export type Cache = {
	responsePromise: AxiosPromise | undefined,
	revalidateDate: Date | undefined,
};

export type Options = {
	enabledByDefault?: boolean,
	cacheFlag?: string,
	revalidateFlag?: string,
	defaultCache?: ICacheLike<Cache>,
};

export default function swrCacheAdapterEnhancer(adapter: AxiosAdapter, options: Options = {}): AxiosAdapter {

	const {
		enabledByDefault = true,
		cacheFlag = 'cache',
		revalidateFlag = 'revalidate',
		defaultCache = new LRUCache<string, AxiosPromise>({ maxAge: FIVE_MINUTES, max: CAPACITY }),
	} = options;

	return config => {

		const { url, method, params, paramsSerializer, forceUpdate, forceRevalidate  } = config;
		const useCache = ((config as any)[cacheFlag] !== void 0 && (config as any)[cacheFlag] !== null)
			? (config as any)[cacheFlag]
			: enabledByDefault;
		const revalidate = ((config as any)[revalidateFlag] !== void 0 && (config as any)[revalidateFlag] !== null)
			? (config as any)[revalidateFlag]
			: enabledByDefault;
		const keepAlive = typeof(revalidate) === 'number' ? revalidate : 0;

		if (method === 'get' && useCache) {

			// if had provide a specified cache, then use it instead
			const cache: ICacheLike<Cache> = isCacheLike(useCache) ? useCache : defaultCache;

			// build the index according to the url and params
			const index = buildSortedURL(url, params, paramsSerializer);

			const cached = cache.get(index);

			if (!cached || !cached.responsePromise || forceUpdate) {

				const cacheSet: Cache = {
					responsePromise: undefined,
					revalidateDate: undefined,
				};

				cacheSet.responsePromise = (async () => {

					try {
						const response = await adapter(config);

						// set expiration date to swrCache for revalidating the request on next call
						if (revalidate && keepAlive > 0) {
							const revalidationDate: Date = new Date();
							revalidationDate.setMilliseconds(revalidationDate.getMilliseconds() + keepAlive);
							cacheSet.revalidateDate =  revalidationDate;
						}

						return response;
					} catch (reason) {
						cache.del(index);
						throw reason;
					}

				})();

				// put the promise for the non-transformed response into cache as a placeholder
				cache.set(index, cacheSet);

				return cacheSet.responsePromise;
			}

			// check if SWR is enabled, then revalidate after delivering the cache
			if (revalidate) {

				const { revalidateDate } = cache.get(index) as Cache;

				if (forceRevalidate || !revalidateDate || revalidateDate < new Date()) {

					const cacheSet: Cache = {
						responsePromise: undefined,
						revalidateDate: undefined,
					};

					cacheSet.responsePromise = (async () => {

						/* istanbul ignore next */
						if (process.env.LOGGER_LEVEL === 'info') {
							// eslint-disable-next-line no-console
							console.info(`[axios-extensions] request revalidated --> url: ${index}`);
						}

						try {
							const response = await adapter(config);

							// set expiration date to swrCache for revalidating the request on next call
							if (keepAlive > 0) {
								const newRevalidationDate: Date = new Date();
								newRevalidationDate.setMilliseconds(newRevalidationDate.getMilliseconds() + keepAlive);
								cacheSet.revalidateDate =  revalidateDate;
							}

							return response;
						} catch (reason) {
							cache.del(index);
							throw reason;
						}

					})();

					// in the case of error occurred
					cacheSet.responsePromise.catch(() => {
						/* istanbul ignore next */
						if (process.env.LOGGER_LEVEL === 'info') {
							// eslint-disable-next-line no-console
							console.info(`[axios-extensions] request revalidation has an error! --> url: ${index}`);
						}
					});

					cache.set(index, cacheSet);
				}
			}

			/* istanbul ignore next */
			if (process.env.LOGGER_LEVEL === 'info') {
				// eslint-disable-next-line no-console
				console.info(`[axios-extensions] request cached by cache adapter --> url: ${index}`);
			}

			return cached.responsePromise;
		}

		return adapter(config);
	};
}
