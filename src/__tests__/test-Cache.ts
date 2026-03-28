import { describe, expect, it } from 'vitest';

import Cache from '../Cache';

describe('Cache', () => {
	it('cache should store and retrieve values', () => {
		const cache = new Cache<string>({ max: 2 });

		cache.set('k1', 'v1');

		expect(cache.get('k1')).toBe('v1');
	});

	it('cache should expire values by ttl', async () => {
		const cache = new Cache<string>({ max: 2, ttl: 10 });

		cache.set('k1', 'v1');
		await new Promise(resolve => setTimeout(resolve, 20));

		expect(cache.get('k1')).toBeUndefined();
	});

	it('cache should support del alias', () => {
		const cache = new Cache<string>({ max: 2 });

		cache.set('k1', 'v1');
		cache.del('k1');

		expect(cache.get('k1')).toBeUndefined();
	});
});
