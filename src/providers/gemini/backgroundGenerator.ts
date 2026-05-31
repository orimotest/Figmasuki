import type { BackgroundBrief, BackgroundResult } from "../../schemas/background";
import { isRecord } from "../../utils/guards";
import { callGeminiText } from "./geminiClient";

export async function generateBackgroundWithGemini(brief: BackgroundBrief): Promise<BackgroundResult> {
  const output = await callGeminiText({
    prompt: buildBackgroundPrompt(brief),
    temperature: 0.45,
    timeoutMs: 45_000,
  });
  const parsed = parseJsonObject(output);
  const colors = readStringArray(isRecord(parsed) ? parsed.colors : undefined, ["#E0F2FE", "#DBEAFE", "#93C5FD", "#0F172A"]).slice(0, 4);
  const styleName = isRecord(parsed) && typeof parsed.styleName === "string" ? parsed.styleName : "Gemini generated background";
  const svg = renderBackgroundSvg(colors);

  return {
    id: `gemini_background_${brief.id}_${Date.now().toString(36)}`,
    brief,
    type: "svg_background",
    colors,
    styleName,
    svg,
    status: "generated",
    message: "Geminiで背景方針を生成し、編集可能なSVG背景として作成しました。",
    createdAt: new Date().toISOString(),
    providerMeta: {
      provider: "gemini",
      fallbackUsed: false,
    },
  };
}

function buildBackgroundPrompt(brief: BackgroundBrief): string {
  return `Return JSON only for a Japanese Figma banner background.
Schema: {"styleName": string, "colors": string[], "motif": string}
Use 4 hex colors. Keep the background behind text subtle and safe.
Do not request text, logos, labels, letters, numbers, UI, buttons, or readable marks inside the background.
The background will be placed under editable SVG text layers in Figma.

Brief:
${JSON.stringify(brief, null, 2)}`;
}

function renderBackgroundSvg(colors: string[]): string {
  const [a, b, c, d] = colors;
  return `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="800" y2="450" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${escapeXml(a)}"/>
      <stop offset="0.58" stop-color="${escapeXml(b)}"/>
      <stop offset="1" stop-color="${escapeXml(c)}"/>
    </linearGradient>
  </defs>
  <rect width="800" height="450" rx="24" fill="url(#bg)"/>
  <circle cx="682" cy="116" r="78" fill="${escapeXml(d)}" opacity="0.24"/>
  <circle cx="704" cy="346" r="112" fill="#FFFFFF" opacity="0.16"/>
  <path d="M510 356 C590 294 660 310 738 244" fill="none" stroke="${escapeXml(d)}" stroke-width="4" opacity="0.34"/>
</svg>`;
}

function readStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && /^#[0-9a-f]{6}$/i.test(item.trim())).map((item) => item.trim());
  return items.length >= 3 ? items : fallback;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const source = fenced?.[1] ?? trimmed;
  const objectStart = source.indexOf("{");
  const objectEnd = source.lastIndexOf("}");
  if (objectStart < 0 || objectEnd <= objectStart) throw new Error("Gemini background generator did not return JSON.");
  return JSON.parse(source.slice(objectStart, objectEnd + 1));
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
