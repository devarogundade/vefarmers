import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [react(), nodePolyfills()],
  server: {
    port: 3000,
  },
  build: {
    minify: false,
    commonjsOptions: { transformMixedEsModules: true },
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer",
      process: "process/browser",
      // crypto: "crypto-browserify",
      stream: "stream-browserify",
      http: "http-browserify",
      https: "https-browserify",
      url: "url",
      util: "util",
      os: "os-browserify",
    },
  },
  optimizeDeps: {
    include: [
      "buffer",
      "process",
      "crypto-browserify",
      "stream-browserify",
      "http-browserify",
      "https-browserify",
      "url",
      "util",
      "os-browserify",
      "mersenne-twister",
    ],
  },
});
