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
		cache?: boolean | ICacheLike<any>;
		stealWhileRevalidate?: boolean | number;
	}
}

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
	swrCache?: ICacheLike<Date>,
};

export default function cacheAdapterEnhancer(adapter: AxiosAdapter, options: Options = {}): AxiosAdapter {

	const {
		enabledByDefault = true,
		cacheFlag = 'cache',
		defaultCache = new LRUCache<string, AxiosPromise>({ maxAge: FIVE_MINUTES, max: CAPACITY }),
		swrCache = new LRUCache<string, Date>({ maxAge: FIVE_MINUTES, max: CAPACITY }),
	} = options;

	return config => {

		const { url, method, params, paramsSerializer, forceUpdate, stealWhileRevalidate = true } = config;
		const useCache = ((config as any)[cacheFlag] !== void 0 && (config as any)[cacheFlag] !== null)
			? (config as any)[cacheFlag]
			: enabledByDefault;

		if (method === 'get' && useCache) {

			// if had provide a specified cache, then use it instead
			const cache: ICacheLike<AxiosPromise> = isCacheLike(useCache) ? useCache : defaultCache;

			// build the index according to the url and params
			const index = buildSortedURL(url, params, paramsSerializer);

			let responsePromise = cache.get(index);

			// console.info(responsePromise);

			if (!responsePromise || forceUpdate) {

				responsePromise = (async () => {

					try {
						const response = await adapter(config);

						if (stealWhileRevalidate as boolean && typeof(stealWhileRevalidate) === "number" && stealWhileRevalidate as number > 0) {
							const now: Date = new Date();
							now.setMilliseconds(now.getMilliseconds() + (stealWhileRevalidate as number));
							swrCache.set(index, now);
						}

						return response;
					} catch (reason) {
						cache.del(index);
						throw reason;
					}

				})();

				// put the promise for the non-transformed response into cache as a placeholder
				cache.set(index, responsePromise);

				/* istanbul ignore next */
				// if (process.env.LOGGER_LEVEL === 'info') {
					// eslint-disable-next-line no-console
					console.info(`[axios-extensions] request cached by cache adapter --> url: ${index}`);
				// }

				return responsePromise;
			}

			if (stealWhileRevalidate as boolean) {

				if (typeof(stealWhileRevalidate) === "number" && stealWhileRevalidate as number > 0) {
					let expiredDate = swrCache.get(index);

					if (!expiredDate || expiredDate < new Date ) {
						let swrResponsePromise = (async () => {

							try {
								const response = await adapter(config);

								const now: Date = new Date();
								now.setMilliseconds(now.getMilliseconds() + (stealWhileRevalidate as number));
								swrCache.set(index, now);

								/* istanbul ignore next */
								// if (process.env.LOGGER_LEVEL === 'info') {
									// eslint-disable-next-line no-console
									console.info(`[axios-extensions] cache revalidate from response after expired keep alive --> url: ${index}`);
								// }

								return response;
							} catch (reason) {
								cache.del(index);
								swrCache.del(index);
								throw reason;
							}
						})();

						// put the promise for the non-transformed response into cache as a placeholder
						cache.set(index, swrResponsePromise);
					}
				} else {
					let swrResponsePromise = (async () => {

						try {
							const response = await adapter(config);

							/* istanbul ignore next */
							// if (process.env.LOGGER_LEVEL === 'info') {
								// eslint-disable-next-line no-console
								console.info(`[axios-extensions] cache revalidate from response without keep alive --> url: ${index}`);
							// }
							return response;
						} catch (reason) {
							cache.del(index);
							throw reason;
						}
					})();

					// put the promise for the non-transformed response into cache as a placeholder
					cache.set(index, swrResponsePromise);
				}
			}

			/* istanbul ignore next */
			// if (process.env.LOGGER_LEVEL === 'info') {
				// eslint-disable-next-line no-console
				console.info(`[axios-extensions] request responded with cached --> url: ${index}`);
			// }
			return responsePromise;
		}

		return adapter(config);
	};
}
