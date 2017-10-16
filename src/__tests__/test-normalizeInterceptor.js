/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-17
 */

import { test } from 'ava';
import axios from 'axios';

import normalizeInterceptor from '../normalizeInterceptor';

test('normalize interceptor should flatten response', async t => {

	const responseData = { name: 'kuitos' };
	const mockAdapter = () => Promise.resolve({
		data: responseData
	});

	const http = axios.create({
		adapter: mockAdapter
	});
	http.interceptors.response.use(normalizeInterceptor.response);

	const response = await http.get('/users');
	t.deepEqual(response, responseData);

});
