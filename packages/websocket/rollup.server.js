import path from "path";
import esbuild from "rollup-plugin-esbuild";
import resolve from "@rollup/plugin-node-resolve";

process.env.NODE_ENV === "production";
/**
 * @return {import("./node_modules/rollup").RollupOptions}
 */
export default async () => {
  return {
    input: "./server/index.ts",
    output: {
      file: "./build/server.js",
      format: "cjs",
    },
    external: ["socket.io", "http", "os", "express", "process"],
    plugins: [
      resolve(),
      esbuild({
        target: "esnext",
        minify: true,
        charset: "utf8",
        tsconfig: path.resolve(__dirname, "tsconfig.json"),
      }),
    ],
  };
};
