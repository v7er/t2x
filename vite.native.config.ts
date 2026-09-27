import { defineConfig, type Plugin } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function injectCssLink(): Plugin {
  return {
    name: "t2x-inject-css",
    apply: "build",
    closeBundle() {
      const dist = fileURLToPath(new URL("./native/electron/dist", import.meta.url));
      const htmlPath = join(dist, "index.html");
      const assets = join(dist, "assets");
      const css = readdirSync(assets).find((name) => name.endsWith(".css"));
      if (!css) return;
      const html = readFileSync(htmlPath, "utf8");
      if (html.includes(css)) return;
      writeFileSync(
        htmlPath,
        html.replace("</head>", `    <link rel="stylesheet" href="./assets/${css}" />\n  </head>`),
      );
    },
  };
}

export default defineConfig({
  root: fileURLToPath(new URL("./native", import.meta.url)),
  base: "./",
  publicDir: fileURLToPath(new URL("./public", import.meta.url)),
  envPrefix: ["VITE_"],
  define: {
    "import.meta.env.VITE_T2X_NATIVE": JSON.stringify("1"),
  },
  resolve: {
    tsconfigPaths: true,
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [tailwindcss(), viteReact(), injectCssLink()],
  build: {
    outDir: fileURLToPath(new URL("./native/electron/dist", import.meta.url)),
    emptyOutDir: true,
    modulePreload: false,
    assetsInlineLimit: 0,
    cssCodeSplit: false,
  },
});
