import { readFileSync } from "node:fs";
import path from "node:path";

import react from "@vitejs/plugin-react";
import * as v from "valibot";
import { defineConfig } from "vitest/config";

const DEV_SERVER_PORT = 4100;

const PackageSchema = v.object({ version: v.string() });
const packageJson = v.parse(
  PackageSchema,
  JSON.parse(readFileSync(path.resolve(import.meta.dirname, "package.json"), "utf-8"))
);

export default defineConfig({
  plugins: [react()],
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version)
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src")
    }
  },
  server: {
    port: DEV_SERVER_PORT,
    fs: {
      allow: [".", "../spec"]
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globalSetup: ["./vitest.global-setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"]
  }
});
