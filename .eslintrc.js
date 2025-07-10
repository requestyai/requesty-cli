module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'prettier'
  ],
  rules: {
    // Relax rules for CLI application
    'no-console': 'off',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'warn', // Warning instead of error
    '@typescript-eslint/no-explicit-any': 'off', // Allow any for flexibility
    'no-useless-escape': 'off', // Allow escape chars in regex
    'no-control-regex': 'off', // Allow control chars in regex
    'no-case-declarations': 'off', // Allow declarations in case blocks
    'no-undef': 'off', // TypeScript handles this
    
    // Keep important rules
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',
  },
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'coverage/',
    'test-results/',
  ],
};