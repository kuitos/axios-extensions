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
		cache?: boolean | ICacheLike<any>;
		stealWhileRevalidate?: boolean;
		keepAlive?: number;
	}
}

const FIVE_MINUTES = 1000 * 60 * 5;
const CAPACITY = 100;

export type Options = {
	enabledByDefault?: boolean,
	cacheFlag?: string,
	stealWhileRevalidateFlag?: string,
	keepAliveFlag?: string,
	defaultCache?: ICacheLike<AxiosPromise>,
	swrDefaultCache?: ICacheLike<Date>,
};

export default function swrCacheAdapterEnhancer(adapter: AxiosAdapter, options: Options = {}): AxiosAdapter {

	const {
		enabledByDefault = true,
		cacheFlag = 'cache',
		stealWhileRevalidateFlag = 'stealWhileRevalidate',
		keepAliveFlag = 'keepAlive',
		defaultCache = new LRUCache<string, AxiosPromise>({ maxAge: FIVE_MINUTES, max: CAPACITY }),
		swrDefaultCache = new LRUCache<string, Date>({ maxAge: FIVE_MINUTES, max: CAPACITY }),
	} = options;

	return config => {

		const { url, method, params, paramsSerializer, forceUpdate } = config;
		const useCache = ((config as any)[cacheFlag] !== void 0 && (config as any)[cacheFlag] !== null)
			? (config as any)[cacheFlag]
			: enabledByDefault;
		const stealWhileRevalidate = ((config as any)[stealWhileRevalidateFlag] !== void 0 && (config as any)[stealWhileRevalidateFlag] !== null)
			? (config as any)[stealWhileRevalidateFlag]
			: enabledByDefault;
		const keepAlive = ((config as any)[keepAliveFlag] !== void 0 && (config as any)[keepAliveFlag] !== null)
			? (config as any)[keepAliveFlag]
			: 0;

		if (method === 'get' && useCache) {

			// if had provide a specified cache, then use it instead
			const cache: ICacheLike<AxiosPromise> = isCacheLike(useCache) ? useCache : defaultCache;

			// if had provide a specified cache for SWR expire date, then use it instead
			const swrCache: ICacheLike<Date> = isCacheLike(stealWhileRevalidate) ? stealWhileRevalidate : swrDefaultCache;

			// build the index according to the url and params
			const index = buildSortedURL(url, params, paramsSerializer);

			let responsePromise = cache.get(index);

			if (!responsePromise || forceUpdate) {

				responsePromise = (async () => {

					try {
						const response = await adapter(config);

						// set expiration date to swrCache for revalidating the request on next call
						if (stealWhileRevalidate) {
							if (keepAlive > 0) {
								const expirationDate: Date = new Date();
								expirationDate.setMilliseconds(expirationDate.getMilliseconds() + keepAlive);
								swrCache.set(index, expirationDate);
							} else {
								swrCache.del(index);
							}
						}

						return response;
					} catch (reason) {
						cache.del(index);
						swrCache.del(index);
						throw reason;
					}

				})();

				// put the promise for the non-transformed response into cache as a placeholder
				cache.set(index, responsePromise);

				return responsePromise;
			}

			// check if SWR is enabled, then revalidate after delivering the cache
			if (stealWhileRevalidate) {

				const expiredDate = swrCache.get(index);

				if (keepAlive === 0 || !expiredDate || expiredDate < new Date()) {

					const revalidatedResponsePromise = (async () => {

						/* istanbul ignore next */
						if (process.env.LOGGER_LEVEL === 'info') {
							// eslint-disable-next-line no-console
							console.info(`[axios-extensions] request revalidated --> url: ${index}`);
						}

						try {
							const response = await adapter(config);

							// set expiration date to swrCache for revalidating the request on next call
							if (keepAlive > 0) {
								const newExpirationDate: Date = new Date();
								newExpirationDate.setMilliseconds(newExpirationDate.getMilliseconds() + keepAlive);
								swrCache.set(index, newExpirationDate);
							} else {
								swrCache.del(index);
							}

							return response;
						} catch (reason) {
							cache.del(index);
							swrCache.del(index);
							throw reason;
						}

					})();

					// in the case of error occurred
					revalidatedResponsePromise.catch(() => {
						/* istanbul ignore next */
						if (process.env.LOGGER_LEVEL === 'info') {
							// eslint-disable-next-line no-console
							console.info(`[axios-extensions] request revalidation has an error! --> url: ${index}`);
						}
					});

					cache.set(index, revalidatedResponsePromise);
				}
			}

			/* istanbul ignore next */
			if (process.env.LOGGER_LEVEL === 'info') {
				// eslint-disable-next-line no-console
				console.info(`[axios-extensions] request cached by cache adapter --> url: ${index}`);
			}

			return responsePromise;
		}

		return adapter(config);
	};
}
