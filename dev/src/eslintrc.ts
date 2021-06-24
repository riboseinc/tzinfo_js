import esRibose from './eslintrc.ribose';

const { rules: riboseStyles } = esRibose;

/* eslint-disable import/no-unused-modules */
export default {
/* eslint-enable import/no-unused-modules */
  root : true,
  env  : {
    node    : true,
    browser : true,
    es6     : true,
  },
  settings : {
    'import/parsers' : {
      '@typescript-eslint/parser' : ['.ts', '.tsx'],
    },
  },
  overrides : [
    // typescript
    {
      'files'         : ['*.ts', '*.tsx'],
      'excludedFiles' : ['*.js', '*.jsx'],
      'parser'        : '@typescript-eslint/parser',
      'plugins'       : [
        '@typescript-eslint',
      ],
      'extends' : [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        // See:
        // https://github.com/typescript-eslint/typescript-eslint/blob/master/docs/getting-started/linting/README.md
        'standard-with-typescript',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
      ],
      'parserOptions' : {
        // https://intellij-support.jetbrains.com/hc/en-us/community/posts/360009471420-parserOptions-project-eslint-path-is-resolved-wrong?page=1#community_comment_360002159120
        tsconfigRootDir                    : __dirname,
        project                            : ['../../tsconfig.eslint.json', '../../tsconfig.json'],
        ecmaVersion                        : 12,
        sourceType                         : 'module',
        warnOnUnsupportedTypeScriptVersion : false,
      },
      'rules' : {
        ...riboseStyles,
        '@typescript-eslint/array-type' : [
          'warn',
          {
            'default' : 'generic',
          },
        ],
        '@typescript-eslint/brace-style'            : riboseStyles['brace-style'],
        '@typescript-eslint/indent'                 : riboseStyles.indent,
        '@typescript-eslint/member-delimiter-style' : [
          'warn',
          {
            multiline : {
              delimiter   : 'semi',
              requireLast : true,
            },
            singleline : {
              delimiter   : 'semi',
              requireLast : false,
            },
          },
        ],
        '@typescript-eslint/no-empty-function' : [
          'off',
        ],
        '@typescript-eslint/no-unused-vars'            : riboseStyles['no-unused-vars'],
        '@typescript-eslint/prefer-nullish-coalescing' : [
          'warn',
        ],
        '@typescript-eslint/prefer-optional-chain' : [
          'warn',
        ],
        '@typescript-eslint/promise-function-async'      : ['off'],
        '@typescript-eslint/semi'                        : riboseStyles.semi,
        '@typescript-eslint/space-before-function-paren' : riboseStyles['space-before-function-paren'],
        'comma-dangle'                                   : [
          'warn',
          'always-multiline',
        ],
        'import/no-unused-modules'        : ['warn', { unusedExports: true }],
        'import/no-useless-path-segments' : ['error', { noUselessIndex: true }],
        'indent'                          : ['off'], // XXX: Not sure why sometimes it gets activated with stock-default values...
        'standard/no-callback-literal'    : 'off',
      },
    },

    // JS files
    {
      'files'         : ['*.js', '*.jsx'],
      'excludedFiles' : ['*.ts', '*.tsx'],
      'extends'       : [
        'eslint:recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
      ],
      'parserOptions' : {
        ecmaVersion : 12,
        sourceType  : 'module',
      },
      'rules' : {
        ...riboseStyles,
        'import/no-unused-modules'        : ['warn', { unusedExports: true }],
        'import/no-useless-path-segments' : ['error', { noUselessIndex: true }],
        'standard/no-callback-literal'    : 'off',
      },
    },

  ],
  globals : {
    Atomics           : 'readonly',
    SharedArrayBuffer : 'readonly',
    $                 : true,
    jQuery            : true,
  },
};
