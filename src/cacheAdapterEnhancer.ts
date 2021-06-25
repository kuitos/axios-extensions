/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

import { AxiosAdapter, AxiosPromise } from 'axios';
import LRUCache from 'lru-cache';
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

export interface ICacheLike<T> {
	get(key: string): T | undefined;

	set(key: string, value: T, maxAge?: number): boolean;

	del(key: string): void;
}

export type Cache = {
	responsePromise: AxiosPromise<any> | undefined,
	expireDate: Date | undefined,
};

export type Options = {
	enabledByDefault?: boolean,
	enabledSwrByDefault?: boolean,
	cacheFlag?: string,
	revalidateFlag?: string,
	defaultCache?: ICacheLike<Cache>,
};

export default function cacheAdapterEnhancer(adapter: AxiosAdapter, options: Options = {}): AxiosAdapter {

	const {
		enabledByDefault = true,
		enabledSwrByDefault = false,
		cacheFlag = 'cache',
		revalidateFlag = 'revalidate',
		defaultCache = new LRUCache<string, Cache>({ maxAge: FIVE_MINUTES, max: CAPACITY }),
	} = options;

	return config => {

		const { url, method, params, paramsSerializer, forceUpdate, forceRevalidate } = config;
		const useCache = ((config as any)[cacheFlag] !== void 0 && (config as any)[cacheFlag] !== null)
			? (config as any)[cacheFlag]
			: enabledByDefault;

		const revalidate = ((config as any)[revalidateFlag] !== void 0 && (config as any)[revalidateFlag] !== null)
			? (config as any)[revalidateFlag]
			: enabledSwrByDefault;

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
					expireDate: undefined,
				};

				cacheSet.responsePromise = (async () => {

					try {
						const response = await adapter(config);

						// set expiration date for revalidating
						if (revalidate) {
							const revalidationDate: Date = new Date();
							revalidationDate.setMilliseconds(revalidationDate.getMilliseconds() + keepAlive);
							cacheSet.expireDate =  revalidationDate;
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

				const { expireDate } = cache.get(index) as Cache;

				if (forceRevalidate || !expireDate || expireDate < new Date()) {

					const cacheSet: Cache = {
						responsePromise: undefined,
						expireDate: undefined,
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
							const newRevalidationDate: Date = new Date();
							newRevalidationDate.setMilliseconds(newRevalidationDate.getMilliseconds() + keepAlive);
							cacheSet.expireDate =  newRevalidationDate;

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
