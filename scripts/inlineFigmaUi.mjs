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

const toBase64 = (value) => Buffer.from(value, "utf8").toString("base64");
const escapeScript = (value) => value.replace(/<\/script/gi, "<\\/script");

const cssBase64 = toBase64(css);

const decodeHelper = `
const decodeUtf8Base64 = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new TextDecoder("utf-8").decode(bytes);
};`;

const inlineCss = `<script>
(() => {
  ${decodeHelper}
  const style = document.createElement("style");
  style.textContent = decodeUtf8Base64("${cssBase64}");
  document.head.appendChild(style);
})();
</script>`;

const inlineJs = `<script>
${escapeScript(js)}
</script>`;

const output = html
  .replace(/<script[^>]*src="\.\/ui\.js"[^>]*><\/script>/, "")
  .replace(/<\/body>/, () => `    ${inlineJs}\n  </body>`)
  .replace(/<link[^>]*href="\.\/assets\/index\.css"[^>]*>/, () => inlineCss);

if (output === html) {
  throw new Error("Failed to inline Figma UI assets. dist/index.html did not match expected Vite output.");
}

await writeFile(indexPath, output, "utf8");
