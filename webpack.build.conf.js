var merge = require('webpack-merge');
var baseConf = require('./webpack.base.conf.js');
var CleanWebpackPlugin = require('clean-webpack-plugin');

var webpackConfig = merge(baseConf, {
  mode: 'production',
  // devtool: '#source-map',
  entry: {
    velement: ['babel-polyfill', './src/main.js']
  },
  output: {
    filename: '[name].min.js'
  },
  optimization: {
    minimize: true
  },
  plugins: [
    new CleanWebpackPlugin(['dist'])
  ]
});
module.exports = webpackConfig;
