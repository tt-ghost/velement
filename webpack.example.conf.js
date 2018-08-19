var merge = require('webpack-merge');
var baseConf = require('./webpack.base.conf.js');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var webpackConfig = merge(baseConf, {
  mode: 'production',
  // devtool: '#source-map',
  entry: {
    'example': ['babel-polyfill', './example/velement/main.js']
  },
  output: {
    filename: '[name].[hash:6].js',
    path: path.resolve(__dirname, 'example-dist')
  },
  optimization: {
    minimize: true
  },
  module: {
    rules: [{
      test: /\.less$/,
      use: ['style-loader', 'css-loader', 'less-loader']
    }]
  },
  plugins: [
    new CleanWebpackPlugin(['example-dist']),
    new CopyWebpackPlugin([
      './example/velement/style.css',
      './example/common.js',
      './example/real-dom',
      './example/index.html'
      ]),
    new HtmlWebpackPlugin({
      // filename: path.resolve(__dirname, './example/index.html'),
      template: './example/velement/index.html',
      inject: 'head'
    })
  ]
});
module.exports = webpackConfig;
