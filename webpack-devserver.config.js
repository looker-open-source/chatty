var path = require('path')

var webpackConfig = {
  entry: {
    demo: './demo/demo.ts',
    demo_client: './demo/client_demo.ts'
  },
  output: {
    filename: "[name].js",
    path: path.join(__dirname, "demo", "build")
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
          }
        ],
        exclude: [
          /node_modules/
        ]
      },
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: 'ts-loader',
            options: {
            }
          }
        ]
      }
    ]
  },
  devtool: 'inline-source-map',
  devServer: {
    compress: true,
    contentBase: [
      path.join(__dirname, "demo"),
      path.join(__dirname, "demo", "build")
    ],
    watchContentBase: true
  }
}

module.exports = webpackConfig
