import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['lib/', 'esm/', 'dist/', 'node_modules/'],
	},
	...tseslint.configs.recommended,
	{
		rules: {
			'indent': ['error', 'tab'],
			'quotes': ['error', 'single', { avoidEscape: true }],
			'no-console': 'off',
			'arrow-parens': ['error', 'as-needed'],
			'sort-keys': 'off',
			'max-len': ['warn', { code: 140 }],
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		},
	},
);
