/**
 * @author Kuitos
 * @since 2020-02-18
 */

import { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import resolveAdapter from './utils/resolveAdapter';
import shouldLogInfo from './utils/shouldLogInfo';

declare module 'axios' {
	interface AxiosRequestConfig {
		retryTimes?: number;
	}
}

export type Options = {
	times?: number;
};

export default function retryAdapterEnhancer(adapter: NonNullable<AxiosRequestConfig['adapter']>, options: Options = {}): AxiosAdapter {

	const resolvedAdapter = resolveAdapter(adapter);
	const { times = 2 } = options;

	return async config => {

		const { retryTimes = times } = config;

		let timeUp = false;
		let count = 0;
		const request = async (): Promise<AxiosResponse> => {
			try {
				return await resolvedAdapter(config);
			} catch (e) {
				timeUp = retryTimes === count;
				if (timeUp) {
					throw e;
				}

				count++;

				/* istanbul ignore next */
				if (shouldLogInfo()) {
					console.info(`[axios-extensions] request start retrying --> url: ${config.url} , time: ${count}`);
				}

				return request();
			}
		};

		return request();
	};
}
