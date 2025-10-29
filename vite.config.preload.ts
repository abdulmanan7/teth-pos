import { defineConfig } from "vite";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "electron/preload.ts"),
      name: "preload",
      fileName: "preload",
      formats: ["cjs"],
    },
    outDir: "dist",
    target: "node22",
    ssr: true,
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: ["electron"],
      output: {
        format: "cjs",
        entryFileNames: "[name].js",
      },
    },
  },
});
