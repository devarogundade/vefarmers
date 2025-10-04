import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    // {
    //   name: "global-polyfill",
    //   config(config) {
    //     if (!config.define) config.define = {};
    //     config.define.global = "globalThis";
    //   },
    //   transformIndexHtml(html) {
    //     return html.replace(
    //       "<head>",
    //       `<head>
    //       <script type="module">
    //         import { Buffer } from 'buffer';
    //         import process from 'process';
    //         window.Buffer = Buffer;
    //         window.process = process;
    //         globalThis.Buffer = Buffer;
    //         globalThis.process = process;
    //         if (typeof global !== 'undefined') {
    //           global.Buffer = Buffer;
    //           global.process = process;
    //         }
    //       </script>`
    //     );
    //   },
    // },
  ],
  server: {
    port: 3000,
  },
  build: {
    minify: false,
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
    ],
  },
});
