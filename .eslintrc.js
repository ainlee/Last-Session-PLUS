module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  extends: ['plugin:prettier/recommended'],
  globals: {
    chrome: 'readonly',
  },
  parser: '@babel/eslint-parser',
  parserOptions: {
    requireConfigFile: false,
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    /**
     * @fixable 箭頭函數只有一個參數的時候，必須加括號
     */
    'arrow-parens': ['error', 'always'],
  },
};
