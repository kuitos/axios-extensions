/**
 * Created by Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2018/1/12 上午11:03
 */
import { AxiosAdapter } from 'axios';
import * as Cache from 'lru-cache';

interface ICacheLike<K, V> {
	get(key: K): V | undefined;
	set(key: K, value: V, maxAge?: number): boolean;
	del(key: K): void;
}

declare const cacheAdapterEnhancer: <K, V>(adapter: AxiosAdapter, cacheEnabledByDefault?: boolean, enableCacheFlag?: string, cacheLike?: ICacheLike<K, V>) => AxiosAdapter;
declare const throttleAdapterEnhancer: (adapter: AxiosAdapter, threshold?: number, cacheCapacity?: number) => AxiosAdapter;
export { cacheAdapterEnhancer, throttleAdapterEnhancer, Cache };
