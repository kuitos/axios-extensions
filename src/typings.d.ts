/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2018-05-04 16:14
 */

import { AxiosRequestConfig } from 'axios';

declare module 'axios' {
	interface AxiosRequestConfig {
		forceUpdate?: boolean;

		[p: string]: any;
	}
}
