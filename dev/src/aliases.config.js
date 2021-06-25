/* Used by webpack, babel and eslint */
/*
 * See:
 * https://github.com/Izhaki/codinsky/blob/e0de8fa9fef562f10493378fd649fdf4aeb34293/aliases.config.js
 */

const { resolve } = require('path');

module.exports = {
  '@' : resolve(__dirname, 'src')
};
