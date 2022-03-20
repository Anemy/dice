const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: [
    'react-hot-loader/patch',
    path.resolve(__dirname, 'src', 'index.tsx'),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'ts-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      'react-dom': '@hot-loader/react-dom',
    },
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    // compress: true,
    // port: 9000,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public', 'index.html'),
      // static: {
      //   directory: path.join(__dirname, 'public'),
      // },
    }),
  ],
};
