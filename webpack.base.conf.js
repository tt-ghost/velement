var path = require('path');

module.exports = {
  output: {
    filename: '[name].[hash:6].js',
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'umd',
    libraryExport: 'default',
    library: 'VElement'
  },
  module: {
    rules: [{
    //   test: /\.js$/,
    //   loader: 'eslint-loader',
    //   include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'example')]
    // }, {
      test: /\.js$/,
      loader: 'babel-loader',
      include: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'example')]
    }]
  }
};
