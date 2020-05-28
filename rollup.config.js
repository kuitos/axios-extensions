/**
 * @author Kuitos
 * @since 2019-05-27
 */

const resolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const builtin = require('rollup-plugin-node-builtins');
const terser = require('rollup-plugin-terser').terser;

function genConfig(minimize = false) {

	return {
		input: './esm/index.js',
		output: {
			name: 'axios-extensions',
			file: minimize ? './dist/axios-extensions.min.js' : './dist/axios-extensions.js',
			format: 'umd',
			sourcemap: true,
		},
		external: ['axios'],
		plugins: [
			resolve(),
			commonjs(),
			builtin(),
			minimize ? terser() : void 0,
		],
	};
}

module.exports = [
	genConfig(),
	genConfig(true),
];
