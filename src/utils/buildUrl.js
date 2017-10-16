/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

import { stringify } from 'querystring';
import { parse } from 'url';
import { isEmpty } from 'lodash';

export default function buildUrl(url, params) {

	const urlObject = parse(url, true);
	let urlPath = urlObject.pathname;
	const urlQueryParams = { ...urlObject.query, ...params };
	if (!isEmpty(urlQueryParams)) {

		const sortedParams = Object.keys(urlQueryParams).sort().reduce((result, param) => {
			result[param] = urlQueryParams[param];
			return result;
		}, {});

		urlPath += `?${stringify(sortedParams)}`;
	}

	return urlPath;
}
