const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.tsx",
  output: {
    filename: "app.js",
    path: path.resolve(__dirname, "dist"),
    clean: true,
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
      CANVA_BACKEND_HOST: JSON.stringify(
        process.env.CANVA_BACKEND_HOST || "http://localhost:3001"
      ),
    }),
  ],
  devServer: {
    port: 8080,
    allowedHosts: "all",
    hot: false,
    liveReload: false,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers":
        "X-Requested-With, content-type, Authorization",
      "Access-Control-Allow-Private-Network": "true",
    },
    historyApiFallback: {
      rewrites: [{ from: /^\/$/, to: "/app.js" }],
    },
    client: false,
  },
  // Avoid eval() which is blocked by Canva's CSP
  devtool: "source-map",
};
