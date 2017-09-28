/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-09-28
 */

import axios from 'axios';

const http = axios.create({
	baseURL: '/',
	headers: { 'Cache-Control': 'no-cache' }
});

export default http;
