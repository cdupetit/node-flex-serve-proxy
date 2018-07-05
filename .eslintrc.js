module.exports = {
  root: true,
  plugins: ['prettier'],
  extends: ['node-flex-serve'],
  rules: {
    'prettier/prettier': [
      'error',
      { singleQuote: true, trailingComma: 'es5', arrowParens: 'always' },
    ],
  },
};
