import globals from 'globals';
import js from '@eslint/js';
import * as parserTS from '@typescript-eslint/parser';
import pluginTS from '@typescript-eslint/eslint-plugin';
import pluginImport from 'eslint-plugin-import';
import pluginImportNewlines from 'eslint-plugin-import-newlines';
import pluginPreferArrow from 'eslint-plugin-prefer-arrow';
import pluginReact from 'eslint-plugin-react';
// eslint-disable-next-line import/default
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReactRefresh from 'eslint-plugin-react-refresh';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginEslintComments from 'eslint-plugin-eslint-comments';
import pluginStylistic from '@stylistic/eslint-plugin';
import pluginVitest from '@vitest/eslint-plugin';

const jsPlugins = {
  import: pluginImport,
  'import-newlines': pluginImportNewlines,
  'prefer-arrow': pluginPreferArrow,
  react: pluginReact,
  'react-hooks': pluginReactHooks,
  'react-refresh': pluginReactRefresh,
  'jsx-a11y': pluginJsxA11y,
  'eslint-comments': pluginEslintComments,
  '@stylistic': pluginStylistic,
};

const tsPlugins = {
  ...jsPlugins,
  '@typescript-eslint': pluginTS,
  ts: pluginTS,
};


const jsRules = {
  ...js.configs.recommended.rules,
  ...pluginEslintComments.configs.recommended.rules,
  ...pluginReact.configs.flat.all.rules,
  ...pluginReactHooks.configs.recommended.rules,
  ...pluginImport.configs.recommended.rules,
  ...pluginReactRefresh.configs.recommended.rules,
  'no-nested-ternary': ['error'],
  curly: ['error', 'all'],
  'no-else-return': ['error'],
  eqeqeq: [
    'error',
    'always',
  ],
  'no-void': ['error', {
    allowAsStatement: true,
  }],
  'no-redeclare': ['error'],
  'import-newlines/enforce': [
    'error',
    1,
  ],
  '@stylistic/type-annotation-spacing': [
    'error',
    {
      before: false,
      after: true,
      overrides: { arrow: { before: true, after: true } },
    },
  ],
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
  '@stylistic/no-multi-spaces': ['error'],
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
  'object-shorthand': ['error', 'always'],
  'default-case': ['error'],
  'prefer-exponentiation-operator': ['error'],
  'no-setter-return': ['error'],
  'no-dupe-else-if': ['error'],
  'no-constructor-return': ['error'],
  'jsx-quotes': ['error', 'prefer-double'],
  'eslint-comments/disable-enable-pair': ['error', {
    allowWholeFile: true,
  }],
  'eslint-comments/no-unlimited-disable': ['error'],
  'eslint-comments/no-unused-disable': ['error'],

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
  'import/order': ['error', {
    'newlines-between': 'always',
    groups: [
      'builtin',
      'external',
      'internal',
      'parent',
      'sibling',
      'index',
      'object',
      'unknown',
    ],
    pathGroups: [
      {
        pattern: '@gen-epix/**',
        group: 'external',
        position: 'after',
      },
    ],
    pathGroupsExcludedImportTypes: ['builtin'],
  }],
  'import/newline-after-import': ['error'],
  'import/no-cycle': ['error', { ignoreExternal: false, maxDepth: 3 }],

  // plugin: react-hooks
  'react-hooks/rules-of-hooks': ['error'],
  'react-hooks/exhaustive-deps': ['error', {
    additionalHooks: 'useCleanupCallback',
  }],

  // plugin: react
  'react/display-name': ['off'],
  'react/require-default-props': ['off'],
  'react/no-unused-prop-types': ['off'],
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
  'react/sort-comp': [
    'error',
    {
      order: [
        'static-variables',
        'static-methods',
        'instance-variables',
        'type-annotations',
        'getters',
        'setters',
        'lifecycle',
        'instance-methods',
        'rendering',
        '/^on.+$/',
        'everything-else',
      ],

    },
  ],
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
  'react/jsx-curly-brace-presence': [
    'error',
    'always',
  ],
  'react/no-set-state': 'off',
  'react/forbid-component-props': 'off',
  'react/jsx-props-no-spreading': 'off',
  'react/button-has-type': 'off',
  'react/jsx-no-leaked-render': 'off',
  'react/jsx-no-useless-fragment': 'off',
};

const tsRules = {
  ...jsRules,
  // ...eslintPluginImport.configs.typescript.rules,
  ...pluginTS.configs['eslint-recommended'].rules,
  ...pluginTS.configs['recommended'].rules,
  ...pluginTS.configs['recommended-requiring-type-checking'].rules,
  ...pluginJsxA11y.configs.recommended.rules,


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
  'react/jsx-one-expression-per-line': ['off'],
  'react/jsx-curly-brace-presence': ['off'],
  // '@typescript-eslint/naming-convention': ['off'],
};

/** @type {import('@typescript-eslint/utils/ts-eslint').FlatConfig.ConfigArray} */
const configArray = [
  {
    settings: {
      // ...eslintPluginImport.configs.typescript.settings,
      vitest: {
        typecheck: true,
      },
      react: {
        version: 'detect',
      },
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
    files: ['**/*.js'],
    ignores: ['**/node_modules/**', '**/dist/**'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 12,
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
