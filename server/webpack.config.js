// Custom webpack config for NestJS monorepo with workspace packages
// Ensures @server/* packages are bundled (not externalized) since they're TypeScript source

const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = function (options) {
  return {
    ...options,
    externals: [
      nodeExternals({
        // @server/* packages are symlinked TS sources — bundle them
        allowlist: [/^@server/],
      }),
    ],
    externalsPresets: { node: true },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, 'apps/api/tsconfig.json'),
        }),
      ],
    },
    output: {
      ...options.output,
      // Ensure ESM modules from packages are treated correctly
      libraryTarget: 'commonjs2',
    },
    module: {
      rules: [
        {
          test: /.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                configFile: path.resolve(__dirname, 'apps/api/tsconfig.json'),
              },
            },
          ],
          exclude: /node_modules\/(?!@server)/,  // Don't exclude @server packages
        },
      ],
    },
  };
};
