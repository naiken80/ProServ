const playwright = require('eslint-plugin-playwright');
const baseConfig = require('../.eslintrc.base.json');

module.exports = [
  playwright.configs['flat/recommended'],

  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.js'],
    // Override or add rules here
    rules: {},
  },
];
