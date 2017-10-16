/**
 * @author Kuitos
 * @homepage https://github.com/kuitos/
 * @since 2017-10-12
 */

/**
 * 精简化返回数据，直接将 response.data 返回给调用者
 * @warning 使用时必须确保该拦截器为最后一个添加进去的，否则可能导致数据异常
 * @type {{response: (function(*))}}
 */
const normalizeInterceptor = {

	response(response) {
		return response.data;
	}

};

export default normalizeInterceptor;
