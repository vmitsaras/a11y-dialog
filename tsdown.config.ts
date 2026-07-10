import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts", "src/docs.ts", "src/outcome.ts", "src/async-action.ts"],
  format: ["esm"],
  dts: true,
  sourcemap: true,
  target: "es2022",
  platform: "neutral",
  outDir: "dist",
  clean: true
});
