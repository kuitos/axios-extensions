/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2018-03-19
 */
export type ICacheLike<T> = {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
} & ({ del(key: string): void } | { delete(key: string): void });

export default function isCacheLike(cache: any): cache is ICacheLike<any> {
	return typeof cache.get === 'function' && typeof cache.set === 'function' && (typeof cache.delete === 'function' || typeof cache.del === 'function');
}
