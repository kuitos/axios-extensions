/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-09-28
 */
import qs from 'querystring';
import { isEmpty } from 'lodash';
import LRUCache from 'lru-cache';
import http from './http';

let httpClient = http;

const buildUrl = (url, params) => {

	let formattedUrl = url;

	if (!isEmpty(params)) {

		const sortedParams = Object.keys(params).sort().reduce((result, param) => {
			result[param] = params[param];
			return result;
		}, {});

		formattedUrl += (formattedUrl.indexOf('?') === -1 ? '?' : '&') + qs.stringify(sortedParams);
	}

	return formattedUrl;
};

const resource = {};
const cache = new LRUCache({ maxAge: 1000 * 60 * 5 });
['delete', 'get', 'head', 'post', 'put', 'patch'].forEach(method => {

	if (method === 'get') {

		resource[method] = (...args) => {

			const [url, config = {}] = args;

			// 以 url 跟 params 建立索引
			const index = buildUrl(url, config.params);

			let responsePromise = cache.get(index);

			// 当缓存中存在前一个 promise cache 并且调用方并未配置 forceUpdate 时，直接返回缓存中的 promise
			if (responsePromise && !config.forceUpdate) {
				return responsePromise;
			}

			responsePromise = httpClient[method](...args).then(res => res.data);
			cache.set(index, responsePromise);

			return responsePromise;
		};

	} else {
		resource[method] = (...args) => httpClient[method](...args).then(res => res.data);
	}

});

export const setHttpClient = client => {
	httpClient = client;
};
export default resource;
