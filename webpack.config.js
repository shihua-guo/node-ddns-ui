const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const history = require('connect-history-api-fallback');
const convert = require('koa-connect');
const webpack = require('webpack');
const internalIp = require('internal-ip');
const url = require('url');
const config = require('./config/' + (process.env.npm_config_config || 'default'));
const pkgInfo = require('./package.json');
// 检测当前是否在开发环境中
const dev = Boolean(process.env.WEBPACK_SERVE);

module.exports = {
  mode: dev ? 'development' : 'production',
  entry: {
    main: ['./src/index.js']
  },
  // 配置source map
  devtool: dev ? 'cheap-module-eval-source-map' : 'hidden-source-map',
  // 打包
  output: {
    path: resolve(__dirname, 'dist'),
    filename: dev ? '[name].js' : '[chunkhash].js', // entry也需要添加hash只有生产的时候才添加hash
    chunkFilename: '[chunkhash].js',
    publicPath: config.publicPath
  },
  module: {
    // 配置loader
    rules: [
      {
        test: /\.js$/,
        // 排除文件
        exclude: /(node_modules|disposables)/,
        // 执行顺序
        use: ['babel-loader', 'eslint-loader']
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader',
            options: {
              // 默认值img：src，意思会默认打包<img>标签的图片
              // 再加上<link> 标签的href 属性，用来打包入口index.html引入的favicon文件
              attrs: ['img:src', 'link:href'],
              root: resolve(__dirname, 'src')
            }
          }
        ]
      },
      {
        test: /favicon\.png/,
        use: [
          {
            loader: 'file-loader',
            options: {
              // name 制定文件输出名，[hash]为源文件的hash值，[ext]为后缀
              name: '[hash].[ext]'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      },
      {
        /*
        匹配各种格式的图片和字体文件
        上面 html-loader 会把 html 中 <img> 标签的图片解析出来，文件名匹配到这里的 test 的正则表达式，
        css-loader 引用的图片和字体同样会匹配到这里的 test 条件
        */
        test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
        // 同时添加exclude favicon的参数
        exclude: /favicon\.png/,
        /*
        使用 url-loader, 它接受一个 limit 参数，单位为字节(byte)

        当文件体积小于 limit 时，url-loader 把文件转为 Data URI 的格式内联到引用的地方
        当文件大于 limit 时，url-loader 会调用 file-loader, 把文件储存到输出目录，并把引用的文件路径改写成输出后的路径

        比如 views/foo/index.html 中
        <img src="smallpic.png">
        会被编译成
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAA...">

        而
        <img src="largepic.png">
        会被编译成
        <img src="/f78661bef717cf2cc2c2e5158f196384.png">
        */
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      chunksSortMode: 'none'
    }),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.DefinePlugin({
      DEBUG: dev,
      VERSION: JSON.stringify(pkgInfo.version),
      CONFIG: JSON.stringify(config.runtimeConfig)
    })
  ],
  optimization: {
    runtimeChunk: true,
    splitChunks: {
      chunks: 'all'
    }
  },
  performance: {
    hints: dev ? false : 'warning'
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, 'src')
    }
  }
};
if (dev) {
  module.exports.serve = {
    host: '0.0.0.0',
    port: config.serve.port,
    hot: {
      host: {
        client: internalIp.v4.sync(),
        server: '0.0.0.0'
      }
    },
    dev: {
      publicPath: config.publicPath
    },
    add: app => {
      app.use(convert(history({
        index: url.parse(config.publicPath).pathname,
        disableDotRule: true,
        htmlAcceptHeaders: ['text/html', 'application/xhtml+xml']
      })));
    }
  };
}