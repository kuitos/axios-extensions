import axios, { AxiosAdapter, AxiosRequestConfig } from 'axios';

type AdapterInput = NonNullable<AxiosRequestConfig['adapter']>;

export default function resolveAdapter(adapter: AdapterInput): AxiosAdapter {
	if (typeof adapter === 'function') {
		return adapter;
	}

	return axios.getAdapter(adapter);
}
