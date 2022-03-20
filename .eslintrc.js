module.exports = {
  root: true,
  extends: ['@mongodb-js/eslint-config-compass'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig-lint.json'],
  },
  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        'react/react-in-jsx-scope': 'off'
      }
    }
  ]
};
