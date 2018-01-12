/**
 * Created by Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2018/1/12 上午11:03
 */
import { AxiosAdapter } from 'axios';
import * as LRU from 'lru-cache';

declare const cacheAdapterEnhancer: (adapter: AxiosAdapter, cacheEnabledByDefault?: boolean, enableCacheFlag?: string, cacheAge?: number) => AxiosAdapter;
declare const throttleAdapterEnhancer: (adapter: AxiosAdapter, threshold?: number, cacheCapacity?: number) => AxiosAdapter;
declare const Cache: LRU;
export { cacheAdapterEnhancer, throttleAdapterEnhancer, Cache };
