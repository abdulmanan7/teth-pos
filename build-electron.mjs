import esbuild from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Build main process
await esbuild.build({
  entryPoints: [path.join(__dirname, "electron/main.ts")],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  outfile: path.join(__dirname, "dist/main.js"),
  external: [
    "electron",
    "express",
    "cors",
    "dotenv",
    "mongoose",
    "zod",
    "fs",
    "path",
    "http",
    "https",
    "url",
    "os",
  ],
  // Use a plugin to mark dynamic imports as external
  plugins: [
    {
      name: "external-modules",
      setup(build) {
        // Mark all imports from server as external
        build.onResolve({ filter: /^\.\.\/server/ }, () => ({
          external: true,
        }));
      },
    },
  ],
  sourcemap: true,
});

// Build preload
await esbuild.build({
  entryPoints: [path.join(__dirname, "electron/preload.ts")],
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outfile: path.join(__dirname, "dist/preload.js"),
  external: ["electron"],
  sourcemap: true,
});

console.log("✓ Electron build complete");
