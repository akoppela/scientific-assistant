import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-shadow': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  // Source files: require namespace imports (except vitest which doesn't support it)
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "ImportSpecifier[parent.source.value!='vitest']",
          message: 'Use namespace imports: `import * as Name from "module"`',
        },
      ],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'public/**'],
  }
);
