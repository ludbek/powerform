var webpack = require('webpack');
var UglifyJsPlugin = require('webpack/lib/optimize/UglifyJsPlugin');

module.exports = {
  target: 'web',
  entry: './index.js',
  output: {
    path: __dirname + '/dist/',
    filename: 'mithril.form.js',
    library: 'Form',
    libraryTarget: 'var'
  },
  externals: {
    lodash: "_",
    "validate.js": "validate"
  },
  plugins: [
    new UglifyJsPlugin()
  ]
};