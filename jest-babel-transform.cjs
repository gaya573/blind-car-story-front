const babelJest = require('babel-jest');
const babelConfig = require('./babel.config.cjs');

function transformViteImportMetaEnv({ types }) {
  return {
    name: 'transform-vite-import-meta-env-for-jest',
    visitor: {
      MetaProperty(path) {
        const envAccess = path.parentPath;
        const isPropertyAccess = envAccess.isMemberExpression() || envAccess.isOptionalMemberExpression();
        if (!isPropertyAccess || envAccess.node.computed) return;
        if (!types.isIdentifier(envAccess.node.property, { name: 'env' })) return;

        envAccess.replaceWith(types.valueToNode({
          DEV: false,
          PROD: false,
          MODE: 'test',
          VITE_API_BASE_URL: 'http://localhost:8080',
          VITE_KAKAO_JS_KEY: '',
        }));
      },
    },
  };
}

module.exports = babelJest.createTransformer({
  ...babelConfig,
  plugins: [...(babelConfig.plugins || []), transformViteImportMetaEnv],
});
