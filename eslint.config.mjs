// ESLint flat config. Goal of this first pass: catch REAL bugs only; style is Prettier's job.
// Most rules are "warn" on purpose: warnings are counted and ratcheted by scripts/lint-ratchet.mjs (they may go down, never up).
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'server/dist/**', 'android/**', 'node_modules/**', 'scripts/golden/expected/**'] },
  {
    files: ['src/**/*.ts', 'server/src/**/*.ts'],
    extends: [tseslint.configs.base],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaVersion: 2022, sourceType: 'module' }, globals: { ...globals.browser, ...globals.es2021 } },
    linterOptions: { reportUnusedDisableDirectives: 'warn' },
    rules: {
      // NOTE: `no-undef` is intentionally OFF for TypeScript files. tsc already fails the build on an undefined name
      // (typescript-eslint documents this), and the rule gives false positives on DOM/ambient types.
      'no-undef': 'off',
      'no-unreachable': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-class-members': 'error',
      'no-duplicate-case': 'error',
      'no-dupe-else-if': 'error',
      'no-self-assign': 'error',
      'no-unsafe-finally': 'error',
      'no-unused-labels': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'no-constant-condition': ['warn', { checkLoops: false }],
      'no-empty': ['warn', { allowEmptyCatch: true }],
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', ignoreRestSiblings: true }],
      eqeqeq: ['warn', 'always', { null: 'ignore' }]
    }
  },
  {
    files: ['scripts/**/*.{mjs,cjs}', 'eslint.config.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
    rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'no-dupe-keys': 'error', 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }], eqeqeq: ['warn', 'always', { null: 'ignore' }] }
  }
);
