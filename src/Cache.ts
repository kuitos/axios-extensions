import { lru, LRU } from 'tiny-lru';

type Options = {
	max?: number;
	ttl?: number;
};

export default class Cache<T> {

	private readonly cache: LRU<T>;

	constructor(options: Options = {}) {
		const {
			max = 100,
			ttl = 0,
		} = options;

		this.cache = lru<T>(max, ttl);
	}

	get(key: string): T | undefined {
		return this.cache.get(key);
	}

	set(key: string, value: T): void {
		this.cache.set(key, value);
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	del(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}
}
