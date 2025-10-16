const path = require('path');

module.exports = {
  entry: './handler.ts',
  target: 'node',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@/shared': path.resolve(__dirname, '../shared'),
    },
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '.webpack'),
    filename: 'handler.js',
  },
  externals: {
    'aws-sdk': 'aws-sdk',
  },
  optimization: {
    minimize: false,
  },
};
