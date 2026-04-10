import { createRequire } from 'node:module';

import globals from 'globals';
import js from '@eslint/js';
import * as parserTS from '@typescript-eslint/parser';
import pluginTS from '@typescript-eslint/eslint-plugin';
import pluginImport from 'eslint-plugin-import';
import pluginImportNewlines from 'eslint-plugin-import-newlines';
import pluginPerfectionist from 'eslint-plugin-perfectionist';
import pluginPreferArrow from 'eslint-plugin-prefer-arrow';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginStylistic from '@stylistic/eslint-plugin';
import pluginVitest from '@vitest/eslint-plugin';

const packageRequire = createRequire(import.meta.url);

const jsPlugins = {
  import: pluginImport,
  'import-newlines': pluginImportNewlines,
  perfectionist: pluginPerfectionist,
  'prefer-arrow': pluginPreferArrow,
  '@stylistic': pluginStylistic,
};

const tsPlugins = {
  ...jsPlugins,
  '@typescript-eslint': pluginTS,
  ts: pluginTS,
};

const tsxPlugins = {
  ...tsPlugins,
  react: pluginReact,
  'react-hooks': pluginReactHooks,
  'react-refresh': pluginReactRefresh,
  'jsx-a11y': pluginJsxA11y,
};


const jsRules = {
  ...js.configs.recommended.rules,
  ...pluginImport.configs.recommended.rules,
  'no-nested-ternary': ['error'],
  curly: ['error', 'all'],
  'no-else-return': ['error'],
  'no-var': ['error'],
  'prefer-const': ['error', {
    destructuring: 'all',
  }],
  'no-const-assign': ['error'],
  'no-unused-vars': [
    'error',
    {
      args: 'all',
      ignoreRestSiblings: false,
      argsIgnorePattern: '^_',
      caughtErrors: 'all',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  eqeqeq: [
    'error',
    'always',
  ],
  'no-void': ['error', {
    allowAsStatement: true,
  }],
  'prefer-template': ['error'],
  'no-redeclare': ['error'],
  'import-newlines/enforce': [
    'error',
    1,
  ],
  // BUG in @stylistic/type-annotation-spacing in combination with @stylistic/arrow-spacing causes incorrect errors
  // '@stylistic/type-annotation-spacing': [
  //   'error',
  //   {
  //     before: false,
  //     after: true,
  //   },
  // ],
  '@stylistic/arrow-spacing': ['error', { before: true, after: true }],
  '@stylistic/member-delimiter-style': ['error'],
  '@stylistic/semi': [
    'error',
    'always',
  ],
  '@stylistic/brace-style': [
    'error',
    '1tbs',
    {
      allowSingleLine: false,
    },
  ],
  '@stylistic/function-call-spacing': ['error', 'never'],
  '@stylistic/indent': ['error', 2],
  '@stylistic/quotes': [
    'error',
    'single',
    {
      avoidEscape: true,
      allowTemplateLiterals: 'always',
    },
  ],
  '@stylistic/quote-props': ['error', 'as-needed'],
  '@stylistic/object-curly-spacing': ['error', 'always'],
  '@stylistic/no-multi-spaces': ['error', {
    ignoreEOLComments: true,
  }],
  '@stylistic/block-spacing': ['error', 'always'],
  '@stylistic/new-parens': ['error', 'always'],
  '@stylistic/no-extra-semi': ['error'],
  '@stylistic/no-whitespace-before-property': ['error'],
  '@stylistic/semi-spacing': ['error'],
  '@stylistic/semi-style': ['error'],
  '@stylistic/space-before-blocks': ['error'],
  '@stylistic/rest-spread-spacing': ['error', 'never'],
  '@stylistic/key-spacing': ['error', {
    beforeColon: false,
    afterColon: true,
    mode: 'strict',
  }],
  '@stylistic/no-trailing-spaces': ['error'],
  '@stylistic/switch-colon-spacing': ['error'],
  '@stylistic/template-tag-spacing': ['error', 'never'],
  '@stylistic/template-curly-spacing': ['error', 'never'],
  '@stylistic/space-in-parens': ['error', 'never'],
  '@stylistic/space-unary-ops': ['error',
    {
      words: true,
      nonwords: false,
    },
  ],
  '@stylistic/space-before-function-paren': [
    'error',
    {
      anonymous: 'never',
      named: 'never',
      asyncArrow: 'always',
    },
  ],
  '@stylistic/space-infix-ops': ['error', { int32Hint: false }],
  '@stylistic/function-paren-newline': ['error', 'consistent'],
  '@stylistic/function-call-argument-newline': ['error', 'consistent'],
  '@stylistic/no-multiple-empty-lines': ['error', { max: 2, maxEOF: 0, maxBOF: 0 }],
  '@stylistic/eol-last': ['error', 'always'],
  '@stylistic/no-tabs': ['error'],
  '@stylistic/comma-dangle': ['error', {
    arrays: 'always-multiline',
    objects: 'always-multiline',
    imports: 'always-multiline',
    exports: 'always-multiline',
    functions: 'always-multiline',
    generics: 'ignore',
    enums: 'always-multiline',
    tuples: 'always-multiline',
  }],
  '@stylistic/jsx-child-element-spacing': ['error'],
  '@stylistic/jsx-closing-bracket-location': ['error', 'line-aligned'],
  '@stylistic/jsx-closing-tag-location': ['error', 'line-aligned'],
  '@stylistic/jsx-curly-brace-presence': ['error', { props: 'always', children: 'always' }],
  '@stylistic/jsx-curly-newline': ['error'],
  '@stylistic/jsx-curly-spacing': ['error', { when: 'never' }],
  '@stylistic/jsx-equals-spacing': ['error', 'never'],
  '@stylistic/jsx-first-prop-new-line': ['error', 'multiline'],
  '@stylistic/jsx-function-call-newline': ['error', 'always'],
  '@stylistic/jsx-indent-props': ['error', 2],
  '@stylistic/jsx-max-props-per-line': ['error'],
  '@stylistic/jsx-newline': ['error', { prevent: true }],
  '@stylistic/jsx-one-expression-per-line': ['error'],
  '@stylistic/jsx-pascal-case': ['error'],
  '@stylistic/jsx-quotes': ['error', 'prefer-single'],
  '@stylistic/jsx-self-closing-comp': ['error'],
  '@stylistic/jsx-tag-spacing': ['error', {
    closingSlash: 'never',
    beforeSelfClosing: 'proportional-always',
    afterOpening: 'never',
    beforeClosing: 'never',
  }],
  '@stylistic/jsx-wrap-multilines': ['error', {
    declaration: 'parens-new-line',
    assignment: 'parens-new-line',
    return: 'parens-new-line',
    arrow: 'parens-new-line',
    condition: 'parens-new-line',
    logical: 'parens-new-line',
    prop: 'parens-new-line',
    propertyValue: 'parens-new-line',
  }],
  'object-shorthand': ['error', 'always'],
  'default-case': ['error'],
  'prefer-exponentiation-operator': ['error'],
  'no-setter-return': ['error'],
  'no-dupe-else-if': ['error'],
  'no-constructor-return': ['error'],

  // plugin: prefer-arrow
  'prefer-arrow/prefer-arrow-functions': [
    'error',
    {
      disallowPrototype: true,
      singleReturnOnly: false,
      classPropertiesAllowed: false,
    },
  ],

  // plugin: import
  'import/no-named-as-default': ['off'],
  'import/named': ['error'],
  'import/no-default-export': ['off'],
  'import/no-absolute-path': ['error'],
  'import/first': ['error'],
  'import/no-duplicates': ['error'],
  'import/newline-after-import': ['error'],
  'import/no-cycle': ['error', { ignoreExternal: false, maxDepth: 3 }],

  // plugin: perfectionist
  'perfectionist/sort-variable-declarations': ['error'],
  'perfectionist/sort-intersection-types': ['error'],
  'perfectionist/sort-import-attributes': ['error'],
  'perfectionist/sort-export-attributes': ['error'],
  'perfectionist/sort-heritage-clauses': ['error'],
  'perfectionist/sort-array-includes': ['error'],
  'perfectionist/sort-arrays': ['error'],
  'perfectionist/sort-named-imports': ['error'],
  'perfectionist/sort-named-exports': ['error'],
  'perfectionist/sort-object-types': ['error'],
  'perfectionist/sort-union-types': ['error'],
  'perfectionist/sort-switch-case': ['error'],
  'perfectionist/sort-decorators': ['error'],
  'perfectionist/sort-interfaces': ['error'],
  'perfectionist/sort-jsx-props': ['error'],
  'perfectionist/sort-modules': ['error'],
  'perfectionist/sort-classes': ['error'],
  'perfectionist/sort-imports': ['error', {
    type: 'unsorted',
    order: 'asc',
    fallbackSort: {
      type: 'subgroup-order',
      order: 'asc',
    },
    newlinesBetween: 1,
    groups: [
      'builtin',
      ['external', 'genEpixExternal'],
      'internal',
      'parent',
      'sibling',
      'index',
      'ts-equals-import',
      'unknown',
    ],
    customGroups: [
      {
        groupName: 'genEpixExternal',
        selector: 'external',
        elementNamePattern: '^@gen-epix/.+',
      },
    ],
  }],
  'perfectionist/sort-exports': ['error'],
  'perfectionist/sort-objects': ['error'],
  'perfectionist/sort-enums': ['error'],
  'perfectionist/sort-sets': ['error'],
  'perfectionist/sort-maps': ['error'],
};

const tsxRules = {
  ...pluginReactRefresh.configs.recommended.rules,
  '@stylistic/jsx-sort-props': ['off'],
  ...pluginReact.configs.flat.all.rules,
  ...pluginReactHooks.configs.recommended.rules,
  ...pluginJsxA11y.configs.recommended.rules,

  // plugin: react-hooks
  'react-hooks/set-state-in-effect': ['off'], // to many false positives
  'react-hooks/immutability': ['off'], // to many false positives
  'react-hooks/preserve-manual-memoization': ['off'], // to many false positives
  'react-hooks/rules-of-hooks': ['error'],
  'react-hooks/exhaustive-deps': ['error', {
    additionalHooks: 'useCleanupCallback',
  }],

  // plugin: react
  'react/display-name': ['off'],
  'react/require-default-props': ['off'],
  'react/no-unused-prop-types': ['off'],
  'react/no-array-index-key': ['error'],
  'react/forbid-foreign-prop-types': ['error', {
    allowInPropTypes: true,
  }],
  'react/jsx-no-comment-textnodes': ['error'],
  'react/jsx-no-duplicate-props': ['error'],
  'react/jsx-equals-spacing': ['error', 'never'],
  'react/jsx-handler-names': ['error',
    {
      eventHandlerPrefix: 'on',
      eventHandlerPropPrefix: 'on',
    },
  ],
  'react/jsx-no-undef': ['error'],
  'react/jsx-indent': [
    'error',
    2,
  ],
  'react/jsx-indent-props': [
    'error',
    2,
  ],
  'react/jsx-pascal-case': [
    'error',
    {
      allowAllCaps: false,
      ignore: [],
    },
  ],
  'react/jsx-filename-extension': [
    'error',
    {
      extensions: [
        '.tsx',
      ],
    },
  ],
  'react/jsx-uses-react': ['off'], // @see https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
  'react/jsx-uses-vars': ['error'],
  'react/no-danger-with-children': ['error'],
  'react/jsx-max-depth': [0],
  'react/no-is-mounted': ['error'],
  'react/no-typos': ['error'],
  'react/react-in-jsx-scope': ['off'], // @see https://reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html
  'react/require-render-return': ['error'],
  'react/style-prop-object': ['error'],
  'react/jsx-newline': ['off'],
  'react/jsx-no-constructed-context-values': ['error'],
  'react/sort-comp': ['off'],
  'react/no-multi-comp': ['off'],
  'react/destructuring-assignment': 'off',
  'react/prefer-stateless-function': [
    'error', {
      ignorePureComponents: true,
    },
  ],
  'react/function-component-definition': [
    'error',
    {
      namedComponents: 'arrow-function',
      unnamedComponents: 'arrow-function',
    },
  ],
  'react/jsx-curly-brace-presence': ['off'],
  'react/jsx-one-expression-per-line': ['off'],
  'react/no-set-state': 'off',
  'react/forbid-component-props': 'off',
  'react/jsx-props-no-spreading': 'off',
  'react/button-has-type': 'off',
  'react/jsx-no-leaked-render': 'off',
  'react/jsx-no-useless-fragment': 'off',
  'react/jsx-no-bind': ['error', {
    ignoreRefs: true,
    allowArrowFunctions: false,
    allowFunctions: false,
    allowBind: false,
  }],
};

const tsRules = {
  ...jsRules,
  ...pluginImport.configs.typescript.rules,
  ...pluginTS.configs['eslint-recommended'].rules,
  ...pluginTS.configs['recommended'].rules,
  ...pluginTS.configs['recommended-requiring-type-checking'].rules,

  '@typescript-eslint/no-misused-promises': 'off',
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      prefer: 'type-imports',
      disallowTypeAnnotations: true,
    },
  ],
  '@typescript-eslint/no-shadow': ['error'],
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      args: 'all',
      ignoreRestSiblings: false,
      argsIgnorePattern: '^_',
      caughtErrors: 'all',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  '@typescript-eslint/no-array-constructor': ['error'],
  '@typescript-eslint/no-empty-function': [
    'error',
    {
      allow: ['constructors'],
    },
  ],
  '@typescript-eslint/no-empty-interface': 'off',
  '@typescript-eslint/unbound-method': 'off',


  '@typescript-eslint/explicit-member-accessibility': [
    'error',
  ],
  '@typescript-eslint/no-empty-object-type': [
    'error',
    {
      allowInterfaces: 'always',
    },
  ],

  '@typescript-eslint/no-extra-parens': [
    'off',
    'all',
    {
      ignoreJSX: 'all',
      nestedBinaryExpressions: false,
      conditionalAssign: false,
    },
  ],
  '@typescript-eslint/no-floating-promises': [
    'error',
    {
      ignoreVoid: true,
    },
  ],
  '@typescript-eslint/no-magic-numbers': [
    'off',
  ],
  '@typescript-eslint/prefer-literal-enum-member': [
    'error',
  ],
  '@typescript-eslint/parameter-properties': [
    'error',
  ],
  '@typescript-eslint/no-require-imports': [
    'error',
  ],
  '@typescript-eslint/no-unnecessary-condition': 'off',
  '@typescript-eslint/no-unnecessary-qualifier': [
    'error',
  ],
  '@typescript-eslint/no-unused-expressions': [
    'error',
  ],
  '@typescript-eslint/no-useless-constructor': ['error'],
  '@typescript-eslint/prefer-for-of': ['error'],
  '@typescript-eslint/prefer-readonly': [
    'error',
  ],
  '@typescript-eslint/prefer-optional-chain': ['error'],
  '@typescript-eslint/promise-function-async': [
    'error',
    {
      checkArrowFunctions: true,
      checkFunctionDeclarations: true,
      checkFunctionExpressions: true,
      checkMethodDeclarations: true,
    },
  ],

  '@typescript-eslint/require-array-sort-compare': ['error'],
  '@typescript-eslint/restrict-plus-operands': [
    'error',
  ],

  '@typescript-eslint/strict-boolean-expressions': 'off',
  '@typescript-eslint/typedef': 'off',
  '@typescript-eslint/unified-signatures': ['error'],
  '@typescript-eslint/restrict-template-expressions': [
    'error',
    {
      allowNumber: true,
      allowNullish: true,
      allowBoolean: true,
    },
  ],
  '@typescript-eslint/no-use-before-define': ['error'],

  '@typescript-eslint/explicit-function-return-type': ['off'],
  '@typescript-eslint/no-unnecessary-type-assertion': ['error', {
    typesToIgnore: ['jest.Mock'],
  }],
  '@typescript-eslint/no-explicit-any': ['error'],

  '@typescript-eslint/naming-convention': [
    'error',
    {
      selector: 'default',
      format: ['camelCase'],
    },
    // Group: variableLike (variable, function, parameter)
    {
      selector: 'variableLike',
      format: ['camelCase', 'PascalCase', 'snake_case'],
      leadingUnderscore: 'allow',
    },
    {
      selector: 'variable',
      format: ['camelCase', 'PascalCase', 'UPPER_CASE', 'snake_case'],
      leadingUnderscore: 'allow',
    },
    // Group: memberLike (property, parameterProperty, method, accessor, enumMember)
    {
      selector: 'memberLike',
      format: ['camelCase', 'UPPER_CASE', 'snake_case'],
    },
    {
      selector: 'memberLike',
      modifiers: ['private'],
      format: ['camelCase', 'snake_case'],
      leadingUnderscore: 'forbid',
    },
    {
      selector: 'enumMember',
      format: ['UPPER_CASE'],
    },
    // Group: typeLike (class, interface, typeAlias, enum, typeParameter)
    {
      selector: 'typeLike',
      format: ['camelCase'],
    },
    {
      selector: 'class',
      format: ['PascalCase'],
    },
    {
      selector: 'interface',
      format: ['PascalCase'],
      custom: {
        regex: '^I[A-Z]',
        match: false,
      },
    },
    {
      selector: 'typeAlias',
      format: ['PascalCase'],
    },
    {
      selector: 'enum',
      format: ['UPPER_CASE'],
    },
    {
      selector: 'typeParameter',
      format: ['PascalCase'],
    },
    // Group: property (classProperty, objectLiteralProperty, typeProperty)
    {
      selector: 'property',
      format: ['camelCase', 'snake_case'],
    },
    {
      selector: 'classProperty',
      format: ['camelCase', 'snake_case'],
      leadingUnderscore: 'allowDouble',
    },
    {
      selector: 'objectLiteralProperty',
      format: ['camelCase', 'UPPER_CASE', 'snake_case'],
    },
    {
      selector: 'objectLiteralProperty',
      modifiers: ['requiresQuotes'],
      format: null,
    },
    {
      selector: 'typeProperty',
      format: ['camelCase', 'UPPER_CASE', 'snake_case'],
    },
    {
      selector: 'typeProperty',
      modifiers: ['requiresQuotes'],
      format: null,
    },
    // Group: method (classMethod, objectLiteralMethod, typeMethod)
    {
      selector: 'method',
      format: ['camelCase'],
    },
    // Group import
    {
      selector: 'import', // matches namespace imports and default imports (i.e. does not match named imports).
      format: ['PascalCase', 'camelCase'],
    },
  ],
  'dot-notation': ['off'],
  // '@typescript-eslint/naming-convention': ['off'],
};

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
const configArray = [
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    settings: {
      ...pluginImport.configs.typescript.settings,
      vitest: {
        typecheck: true,
      },
      react: { version: '19' }, // Avoids auto-detection crash
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/*.test.ts', '**/*.test.tsx', '**/test/setup.ts', '**/src/api/**'],
    languageOptions: {
      parser: parserTS,
      parserOptions: {
        ecmaFeatures: { modules: true },
        ecmaVersion: 'latest',
        project: './tsconfig.json',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        __PACKAGE_JSON_VERSION__: 'readonly',
        __COMMIT_HASH__: 'readonly',
      },
    },
    plugins: {
      ...tsPlugins,
    },
    rules: {
      ...tsRules,
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/test/setup.ts'],
    ignores: ['**/node_modules/**', '**/dist/**'],
    languageOptions: {
      globals: {
        ...pluginVitest.environments.env.globals,
        ...globals.node,
        ...globals.browser,
        __PACKAGE_JSON_VERSION__: 'readonly',
        __COMMIT_HASH__: 'readonly',
      },
      parser: parserTS,
      parserOptions: {
        ecmaFeatures: { modules: true },
        ecmaVersion: 'latest',
        project: './tsconfig.json',
      },
    },
    plugins: {
      vitest: pluginVitest,
      ...tsPlugins,
    },
    rules: {
      ...pluginVitest.configs.recommended.rules,
      ...tsRules,
    },
  },
  {
    files: ['**/*.tsx'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/src/api/**'],
    plugins: {
      ...tsxPlugins,
    },
    rules: {
      ...tsxRules,
    },
  },
  {
    files: ['**/*.js'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/eslint.config.js'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
      },
    },
    plugins: {
      ...jsPlugins,
    },
    rules: {
      ...jsRules,
    },
  },
];

export default configArray;
