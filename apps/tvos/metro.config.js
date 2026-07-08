const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

// This app lives in a monorepo and consumes `@adsb/shared` (built to
// packages/shared/dist) via a `file:` dependency, which npm symlinks into
// node_modules. Metro must watch the monorepo root so it can follow that
// symlink out of the project directory, and must resolve modules from both the
// app's own node_modules and the repo root.
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

/** @type {import('metro-config').MetroConfig} */
const config = {
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
