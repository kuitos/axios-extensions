/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

import axios, { AxiosRequestConfig } from 'axios';

// Use a dedicated Axios instance with empty defaults so global axios.defaults mutations do not affect request keys
const cleanAxios = new axios.Axios({});

export default function buildSortedURL(config: AxiosRequestConfig): string {
	const {
		url = '',
		baseURL,
		allowAbsoluteUrls,
		params,
		paramsSerializer,
	} = config;
	const builtURL = cleanAxios.getUri({
		url,
		baseURL,
		allowAbsoluteUrls,
		params,
		paramsSerializer,
	});

	const [urlPath, queryString] = builtURL.split('?');

	if (queryString) {
		const paramsPair = queryString.split('&');
		return `${urlPath}?${paramsPair.sort().join('&')}`;
	}

	return builtURL;
}
