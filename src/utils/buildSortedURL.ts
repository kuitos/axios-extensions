/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

import axios from 'axios';

export default function buildSortedURL(...args: any[]) {
	const [url, params, paramsSerializer] = args;
	const builtURL = axios.getUri({ url, params, paramsSerializer });

	const [urlPath, queryString] = builtURL.split('?');

	if (queryString) {
		const paramsPair = queryString.split('&');
		return `${urlPath}?${paramsPair.sort().join('&')}`;
	}

	return builtURL;
}
