const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

module.exports = {
  entry: './index.web.js',
  output: {
    path: path.resolve(__dirname, 'web-build'),
    filename: 'bundle.js',
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            configFile: './.babelrc.web.js',
          },
        },
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.ttf$/,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
    },
    extensions: ['.web.js', '.js', '.jsx', '.json'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_COUCHDB_URL': JSON.stringify(process.env.REACT_APP_COUCHDB_URL),
      'process.env.REACT_APP_COUCHDB_USERNAME': JSON.stringify(process.env.REACT_APP_COUCHDB_USERNAME),
      'process.env.REACT_APP_COUCHDB_PASSWORD': JSON.stringify(process.env.REACT_APP_COUCHDB_PASSWORD),
      'process.env.REACT_APP_COUCHDB_DATABASE': JSON.stringify(process.env.REACT_APP_COUCHDB_DATABASE),
      'process.env.REACT_APP_ENABLE_AUTO_SYNC': JSON.stringify(process.env.REACT_APP_ENABLE_AUTO_SYNC),
    }),
  ],
  devServer: {
    historyApiFallback: true,
    port: 3001,
    hot: true,
  },
};
