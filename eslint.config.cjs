const { FlatCompat } = require('@eslint/eslintrc')
const jsConfig = {
  ignores: ['node_modules/**', '.next/**'],
  languageOptions: {
    parser: require.resolve('@typescript-eslint/parser'),
    parserOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
  },
  plugins: { '@typescript-eslint': require('@typescript-eslint/eslint-plugin') },
  rules: {
    'no-unused-vars': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
}

// Use compat for recommended base configs
const compat = new FlatCompat({})
module.exports = [...compat.extends('plugin:react/recommended'), jsConfig]
