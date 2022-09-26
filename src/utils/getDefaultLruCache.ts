import { AxiosPromise } from 'axios';
import LRUCache from 'lru-cache';

export interface ICacheLike<T> {
	get(key: string): T | undefined;

	set(key: string, value: T): void;

	del(key: string): void;
}

export default function getDefaultLruCache<T>(options: LRUCache.Options<any, any>): ICacheLike<T> {
	const defaultLruCache = new LRUCache<string, T>(options);
	return {
		get: defaultLruCache.get.bind(defaultLruCache),
		set: defaultLruCache.set.bind(defaultLruCache),
		del: defaultLruCache.delete.bind(defaultLruCache),
	};
}
