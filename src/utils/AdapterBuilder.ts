import { AxiosAdapter } from 'axios';
import cacheAdapterEnhancer, { Options as CacheOptions } from '../cacheAdapterEnhancer';
import retryAdapterEnhancer, { Options as RetryOptions } from '../retryAdapterEnhancer';
import throttleAdapterEnhancer, { Options as ThrottleOptions } from '../throttleAdapterEnhancer';

type EnhancerWithOptions =
	| {
	enhancer: typeof cacheAdapterEnhancer;
	options: CacheOptions;
}
	| {
	enhancer: typeof retryAdapterEnhancer;
	options: RetryOptions;
}
	| {
	enhancer: typeof throttleAdapterEnhancer;
	options: ThrottleOptions;
};

type Enhancer = EnhancerWithOptions['enhancer'];
type ExtractOptions<E extends Enhancer, O extends EnhancerWithOptions> = O extends { enhancer: E; }
	? O['options']
	: never;
type Options<E extends Enhancer> = ExtractOptions<E, EnhancerWithOptions>;

export default class AdapterBuilder {

	public adapter: AxiosAdapter;

	constructor(adapter: AxiosAdapter) {
		this.adapter = adapter;
	}

	public enhance<E extends Enhancer, O extends Options<E>>(enhancer: E, options?: O) {
		this.adapter = enhancer(this.adapter, options);
		return this;
	}

	public build() {
		return this.adapter;
	}
}