import { ICacheLike } from './isCacheLike';

export default function deleteCacheEntry<T>(cache: ICacheLike<T>, key: string): void {
	if ('delete' in cache) {
		cache.delete(key);
		return;
	}

	cache.del(key);
}
