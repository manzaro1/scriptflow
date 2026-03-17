const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./src/index.ghpages.tsx",
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
    publicPath: "./",
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),
    new webpack.DefinePlugin({
      CANVA_BACKEND_HOST: JSON.stringify(""),
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
      filename: "index.html",
    }),
  ],
  devtool: "source-map",
};
