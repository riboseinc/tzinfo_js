module.exports = {
  'env' : {
    browser : true,
    es2021  : true,
    node    : true
  },
  'extends'       : 'eslint:recommended',
  'parserOptions' : {
    ecmaVersion : 12
  },
  'globals' : {
    define : true
  },
  'rules' : {
    'brace-style' : [
      'warn', 'stroustrup', { allowSingleLine: true }
    ],
    'camelcase' : [
      'warn', {
        properties          : 'never',
        ignoreImports       : true,
        ignoreDestructuring : true
      }
    ],
    'comma-dangle' : [
      'warn',
      'never'
    ],
    'dot-location' : [
      'error',
      'object'
    ],
    'dot-notation' : [
      'error',
      {
        allowKeywords : true
      }
    ],
    'eqeqeq' : [
      'error',
      'smart'
    ],
    'indent' : [
      'warn',
      2,
      {
        SwitchCase         : 1,
        VariableDeclarator : {
          'var'   : 2,
          'let'   : 2,
          'const' : 3
        },
        ignoredNodes : ['ConditionalExpression']
      }
    ],
    'key-spacing' : [
      'error', {
        singleLine : {
          beforeColon : false,
          afterColon  : true
        },
        multiLine : {
          beforeColon : true,
          afterColon  : true,
          align       : 'colon'
        }
      }],
    'keyword-spacing' : [
      'error', {
        before : true,
        after  : true
      }],
    'max-len' : [
      'warn', {
        code       : 100,
        comments   : 150,
        ignoreUrls : true
      }],
    'new-cap' : ['warn', {
      newIsCap   : false,
      properties : false
    }],
    'no-cond-assign'        : ['error', 'except-parens'],
    'no-constant-condition' : [
      'error', {
        checkLoops : false
      }
    ],
    'no-multi-spaces' : [
      'warn', {
        exceptions : {
          VariableDeclarator : true
        }
      }],
    'no-plusplus' : [
      'error', {
        allowForLoopAfterthoughts : true
      }],
    'no-underscore-dangle' : ['off'],
    'no-unused-vars'       : [
      'warn', {
        argsIgnorePattern : '^_',
        args              : 'none'
      }
    ],
    'no-void'                  : ['error', { allowAsStatement: true }],
    'node/no-callback-literal' : ['off'],
    'object-curly-spacing'     : [
      'error',
      'always',
      { objectsInObjects: false, arraysInObjects: false }
    ],
    'one-var'     : ['error', 'consecutive'],
    'quote-props' : [
      'error',
      'consistent-as-needed', { keywords: true }
    ],
    'quotes' : [
      'warn',
      'single',
      { avoidEscape: true }
    ],
    'require-jsdoc'               : ['off'],
    'semi'                        : ['warn', 'always'],
    'space-before-function-paren' : [
      'error',
      {
        anonymous  : 'never',
        named      : 'never',
        asyncArrow : 'always'
      }
    ],
    'spaced-comment' : [
      'error',
      'always', {
        exceptions : ['-', '+', '=', '*'],
        markers    : ['=', '*/', '/*', 'X', '//']
      }],
    'valid-jsdoc' : ['off']
  }
};
