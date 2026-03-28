import { AxiosAdapter, AxiosRequestConfig } from 'axios';

type Callback = () => void;

export default function genMockAdapter(cb: Callback): AxiosAdapter {
	return function mockedAdapter(config: AxiosRequestConfig & { error?: boolean }) {
		cb();
		if (config.error) {
			return Promise.reject(config);
		}

		return Promise.resolve(config as any);
	};
}
