const path = require("path");
const { default: HtmlPlugin } = require("@rspack/plugin-html");
const CopyPlugin = require("copy-webpack-plugin");
const { getId } = require("laser-utils");

const PUBLIC_PATH = "/";
const RANDOM_ID = getId();
const isDev = process.env.NODE_ENV === "development";

/**
 * @type {import("@rspack/cli").Configuration}
 */
const Main = {
  context: __dirname,
  entry: {
    index: "./client/index.tsx",
  },
  plugins: [
    new CopyPlugin([{ from: "./client/static", to: "." }]),
    new HtmlPlugin({
      filename: "index.html",
      template: "./client/static/index.html",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
    },
  },
  builtins: {
    define: {
      "__DEV__": JSON.stringify(isDev),
      "process.env.RANDOM_ID": JSON.stringify(RANDOM_ID),
      "process.env.PUBLIC_PATH": JSON.stringify(PUBLIC_PATH),
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    },
    pluginImport: [
      {
        libraryName: "@arco-design/web-react",
        customName: "@arco-design/web-react/es/{{ member }}",
        style: true,
      },
    ],
  },
  module: {
    rules: [
      { test: /\.svg$/, type: "asset" },
      {
        test: /\.(m|module).scss$/,
        use: [{ loader: "sass-loader" }],
        type: "css/module",
      },
      {
        test: /\.less$/,
        use: [
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                javascriptEnabled: true,
                importLoaders: true,
                localIdentName: "[name]__[hash:base64:5]",
              },
            },
          },
        ],
        type: "css",
      },
    ],
  },
  target: "es5",
  devtool: isDev ? "source-map" : false,
  output: {
    publicPath: PUBLIC_PATH,
    chunkLoading: "jsonp",
    chunkFormat: "array-push",
    filename: "[name].[hash].js",
    path: path.resolve(__dirname, "build/static"),
  },
};

/**
 * @type {import("@rspack/cli").Configuration}
 */
const Worker = {
  context: __dirname,
  entry: {
    worker: "./client/worker/index.ts",
  },
  output: {
    clean: true,
    filename: "[name].js",
    path: path.resolve(__dirname, "build/static"),
  },
};

module.exports = [Main, Worker];

// https://www.rspack.dev/
