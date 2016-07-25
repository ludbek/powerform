var webpack = require('webpack');
var UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');

module.exports = {
  target: 'web',
  entry: './index.js',
  output: {
    path: __dirname + '/dist/',
    filename: 'powerform.min.js',
    library: 'powerform',
    libraryTarget: 'var'
  },
  externals: {
  },
  module: {
    loaders: [
      {test: /\.js/, loader: "babel", include: __dirname + "/index.js"}
    ]
  },
  plugins: [
    new UglifyJsPlugin()
  ]
};
