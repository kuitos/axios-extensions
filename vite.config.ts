import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import type { LibraryFormats } from 'vite';

const ENTRY = resolve(__dirname, 'src/index.ts');
const LOGGER_LEVEL = JSON.stringify('');
const EXTERNALS = ['axios'];
const UMD_GLOBALS = { axios: 'axios' };

type BuildMode = 'cjs' | 'esm' | 'umd' | 'umd-min';

function createBaseBuild(outDir: 'lib' | 'esm' | 'dist', minify: boolean) {
	return {
		emptyOutDir: false,
		sourcemap: true,
		outDir,
		minify,
		rollupOptions: {
			external: EXTERNALS,
		},
	};
}

function createModuleConfig(format: LibraryFormats, outDir: 'lib' | 'esm') {
	return {
		build: {
			...createBaseBuild(outDir, false),
			lib: {
				entry: ENTRY,
				formats: [format],
				fileName: () => 'index.js',
			},
		},
	};
}

function createUmdConfig(fileName: string, minify: boolean) {
	return {
		define: {
			'process.env.LOGGER_LEVEL': LOGGER_LEVEL,
		},
		build: {
			...createBaseBuild('dist', minify),
			lib: {
				entry: ENTRY,
				name: 'axios-extensions',
				formats: ['umd' as LibraryFormats],
				fileName: () => fileName,
			},
			rollupOptions: {
				external: EXTERNALS,
				output: {
					globals: UMD_GLOBALS,
				},
			},
		},
	};
}

export default defineConfig(({ mode }) => {
	switch (mode as BuildMode) {
		case 'cjs':
			return createModuleConfig('cjs', 'lib');
		case 'esm':
			return createModuleConfig('es', 'esm');
		case 'umd':
			return createUmdConfig('axios-extensions.js', false);
		case 'umd-min':
			return createUmdConfig('axios-extensions.min.js', true);
		default:
			throw new Error(`Unknown build mode: ${mode}`);
	}
});
