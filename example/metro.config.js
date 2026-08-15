const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const libraryRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// The library is linked with `file:..`, so Metro has to watch its source to
// pick up edits and hot-reload them.
config.watchFolders = [libraryRoot];

/**
 * The library has its own `node_modules` containing react and react-native as
 * devDependencies. If Metro resolves those, the app ends up with two copies of
 * React and hooks break at runtime with errors that look nothing like the
 * cause. Blocking that directory and redirecting the shared packages to the
 * example's own copies keeps exactly one of each.
 */
const escapeForRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

config.resolver.blockList = [
  new RegExp(`^${escapeForRegExp(path.join(libraryRoot, 'node_modules'))}/.*$`),
];

config.resolver.extraNodeModules = [
  'react',
  'react-native',
  'react-native-safe-area-context',
].reduce((mapped, name) => {
  mapped[name] = path.join(projectRoot, 'node_modules', name);
  return mapped;
}, {});

module.exports = config;
