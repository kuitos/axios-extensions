export default function shouldLogInfo() {
	return typeof process !== 'undefined' && process.env.LOGGER_LEVEL === 'info';
}
