import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import replace from '@rollup/plugin-replace';

function genConfig(minimize = false) {
	return {
		input: './esm/index.js',
		output: {
			name: 'axios-extensions',
			file: minimize ? './dist/axios-extensions.min.js' : './dist/axios-extensions.js',
			format: 'umd',
			sourcemap: true,
			globals: {
				axios: 'axios',
			},
		},
		external: ['axios'],
		plugins: [
			resolve({ browser: true }),
			commonjs(),
			replace({
				'process.env.LOGGER_LEVEL': JSON.stringify(''),
				preventAssignment: true,
			}),
			minimize ? terser() : undefined,
		].filter(Boolean),
	};
}

export default [genConfig(), genConfig(true)];
