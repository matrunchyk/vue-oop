module.exports = {
  extends: [
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
  },

  plugins: [
    '@typescript-eslint',
  ],

  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/ban-ts-ignore': 0,
  },

  overrides: [
    {
      files: [
        '**/__tests__/*.{j,t}s?(x)',
      ],
      env: {
        jest: true,
      },
    },
  ],
};
