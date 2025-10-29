import { defineConfig } from "vite";
import path from "path";

const __dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "electron/main.ts"),
      name: "main",
      fileName: "main",
      formats: ["es"],
    },
    outDir: "dist",
    target: "node22",
    ssr: true,
    minify: false,
    sourcemap: true,
    rollupOptions: {
      external: [
        "electron",
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        "express",
        "cors",
        "dotenv",
      ],
      output: {
        format: "es",
        entryFileNames: "[name].js",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
