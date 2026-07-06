'use strict'

const { eslintConfig } = require('./package.json')
eslintConfig.parser = '@typescript-eslint/parser'
eslintConfig.parserOptions.sourceType = 'module'
eslintConfig.extends.push(
  'plugin:@typescript-eslint/eslint-recommended',
  'plugin:@typescript-eslint/recommended'
)

eslintConfig.rules['node/no-unsupported-features/es-syntax'] = 'off'
eslintConfig.rules['comma-dangle'] = ['error', 'only-multiline']
eslintConfig.rules.semi = ['error', 'always']
eslintConfig.rules['space-before-function-paren'] = ['error', 'never']

// The legacy node/import resolvers cannot follow tsd's "exports" map.
eslintConfig.rules['node/no-missing-import'] = ['error', { allowModules: ['tsd'] }]
eslintConfig.rules['import/no-unresolved'] = ['error', { ignore: ['^tsd$'] }]

module.exports = eslintConfig
