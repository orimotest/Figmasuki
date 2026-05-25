import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const distDir = "dist";
const indexPath = join(distDir, "index.html");
const cssPath = join(distDir, "assets", "index.css");
const jsPath = join(distDir, "ui.js");

const [html, css, js] = await Promise.all([
  readFile(indexPath, "utf8"),
  readFile(cssPath, "utf8"),
  readFile(jsPath, "utf8"),
]);

const inlineCss = `<style>\n${css.replaceAll("</style", "<\\/style")}\n</style>`;
const inlineJs = `<script>\n${js.replaceAll("</script", "<\\/script")}\n</script>`;

const output = html
  .replace(/<script[^>]*src="\.\/ui\.js"[^>]*><\/script>/, inlineJs)
  .replace(/<link[^>]*href="\.\/assets\/index\.css"[^>]*>/, inlineCss);

if (output === html) {
  throw new Error("Failed to inline Figma UI assets. dist/index.html did not match expected Vite output.");
}

await writeFile(indexPath, output, "utf8");
