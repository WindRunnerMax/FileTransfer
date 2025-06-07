import path from "path";
import esbuild from "rollup-plugin-esbuild";

export default async () => {
  return {
    input: "./server/index.ts",
    output: {
      file: "./build/server.js",
      format: "cjs",
    },
    external: [
      "socket.io",
      "http",
      "node:os",
      "express",
      "process",
      "path",
      "node:crypto",
      "@block-kit/utils",
    ],
    plugins: [
      esbuild({
        exclude: [/node_modules/],
        target: "esnext",
        minify: true,
        charset: "utf8",
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
    ],
  };
};
