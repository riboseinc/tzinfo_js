/* See:
 * https://github.com/Izhaki/codinsky/blob/e0de8fa9fef562f10493378fd649fdf4aeb34293/eslintAliasesResolver.js
 */
module.exports.interfaceVersion = 2;

module.exports.resolve = (source, file, aliases) => {
  if (aliases[source]) {
    return { found: true, path: aliases[source] };
  }
  return { found: false };
};
