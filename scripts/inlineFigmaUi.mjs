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

const escapeScriptEnd = (value) => value.replace(/<\/script/gi, "<\\/script");

const jsonCss = escapeScriptEnd(JSON.stringify(css));
const jsonJs = escapeScriptEnd(JSON.stringify(js));

const inlineCss = `<script>
(() => {
  const style = document.createElement("style");
  style.textContent = ${jsonCss};
  document.head.appendChild(style);
})();
</script>`;

const inlineJs = `<script>
(() => {
  const source = ${jsonJs};
  const blob = new Blob([source], { type: "text/javascript" });
  const script = document.createElement("script");
  script.src = URL.createObjectURL(blob);
  script.onload = () => URL.revokeObjectURL(script.src);
  document.head.appendChild(script);
})();
</script>`;

const output = html
  .replace(/<script[^>]*src="\.\/ui\.js"[^>]*><\/script>/, () => inlineJs)
  .replace(/<link[^>]*href="\.\/assets\/index\.css"[^>]*>/, () => inlineCss);

if (output === html) {
  throw new Error("Failed to inline Figma UI assets. dist/index.html did not match expected Vite output.");
}

await writeFile(indexPath, output, "utf8");
