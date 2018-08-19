var merge = require('webpack-merge');
var baseConf = require('./webpack.base.conf.js');
var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');

var devWebpackConfig = merge(baseConf, {
  mode: 'development',
  devtool: 'eval-source-map',
  entry: {
    'example': ['babel-polyfill', './example/velement/main.js']
  },
  module: {
    rules: [{
      test: /\.less$/,
      use: ['style-loader', 'css-loader', 'less-loader']
    }]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new HtmlWebpackPlugin({
      // filename: path.resolve(__dirname, './example/index.html'),
      template: './example/velement/index.html',
      inject: 'head'
    }),
    new FriendlyErrorsPlugin({
      compilationSuccessInfo: {
        messages: ['Your application is running here: http://0.0.0.0:9200']
      },
      onErrors: undefined
    })
  ],
  devServer: {
    clientLogLevel: 'warning',
    historyApiFallback: true,
    hot: true,
    compress: true,
    host: '0.0.0.0',
    port: '9200',
    open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    publicPath: '/',
    proxy: {},
    quiet: true, // necessary for FriendlyErrorsPlugin
    watchOptions: {
      poll: false
    }
  }
});
module.exports = new Promise((resolve, reject) => {
  resolve(devWebpackConfig);
});
