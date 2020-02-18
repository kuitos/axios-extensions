/**
 * @author Kuitos
 * @since 2020-02-18
 */

import { AxiosAdapter, AxiosResponse } from 'axios';

export type Options = {
	times?: number;
};

export default function retryAdapterEnhancer(adapter: AxiosAdapter, options: Options = {}): AxiosAdapter {

	const { times = 2 } = options;

	return async config => {

		const { retryTimes = times } = config;

		let timeUp = false;
		let count = 0;
		const request = async (): Promise<AxiosResponse> => {
			try {
				return await adapter(config);
			} catch (e) {
				timeUp = retryTimes === count;
				if (timeUp) {
					throw e;
				}

				count++;

				/* istanbul ignore next */
				if (process.env.NODE_ENV === 'development' || process.env.LOGGER_LEVEL === 'info') {
					console.info(`request ${config.url} start retrying at time ${count}`);
				}

				return request();
			}
		};

		return request();
	};
}
