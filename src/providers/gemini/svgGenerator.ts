import { CANVAS_SIZE } from "../../config/canvas";
import { env } from "../../config/env";
import type { Direction } from "../../schemas/direction";
import type { SvgCandidate } from "../../schemas/svg";
import { extractSvgFromText, validateSvg } from "../../utils/svgValidator";
import { callGeminiText } from "./geminiClient";

export async function generateSvgWithGemini(direction: Direction): Promise<SvgCandidate> {
  const first = await requestSvg(direction, buildSvgPrompt(direction));
  if (first.validation.valid) {
    return first;
  }

  const repairPrompt = buildRepairPrompt(direction, first.svg, first.validation.errors);
  const repaired = await requestSvg(direction, repairPrompt);
  if (!repaired.validation.valid) {
    throw new Error(`Gemini SVG validation failed for ${direction.id}: ${repaired.validation.errors.join(" ")}`);
  }
  return repaired;
}

async function requestSvg(direction: Direction, prompt: string): Promise<SvgCandidate> {
  const text = await callGeminiText({ model: env.GEMINI_SVG_MODEL, prompt, temperature: 0.35 });
  const svg = extractSvgFromText(text);
  const validation = validateSvg(svg);
  const now = new Date().toISOString();

  return {
    id: `svg_${direction.id}`,
    directionId: direction.id,
    contentType: direction.contentType,
    name: createGeneratedNodeName(direction),
    svg,
    width: 800,
    height: 450,
    previewLabel: direction.title,
    validation,
    meta: {
      layoutType: direction.layoutType,
      provider: "gemini",
      fallbackUsed: false,
      generatedAt: now,
    },
    createdAt: now,
  };
}

export function buildSvgPrompt(direction: Direction): string {
  const safe = CANVAS_SIZE.safeArea;
  return `Return SVG only. Do not include markdown or explanation.

Create an editable Figma-friendly SVG layout for contentType=${direction.contentType}.
Canvas:
- width="800"
- height="450"
- viewBox="0 0 800 450"
- safe area: x=${safe.x} y=${safe.y} width=${safe.width} height=${safe.height}

Direction:
- name: ${direction.title}
- intent: ${direction.intent}
- layoutType: ${direction.layoutType}
- tone: ${direction.tone.join(", ")}
- main copy: ${direction.copy.main}
- sub copy: ${direction.copy.sub}
- cta: ${direction.copy.cta ?? ""}

Design rules:
- Use <text> elements. Do not convert text to paths.
- Use rect + text for CTA when CTA exists.
- Buttons, CTAs, badges, and pills must have generous padding: at least 24px horizontal padding and 10-14px vertical padding around the visible label.
- Do not let Japanese text touch the rounded rectangle edge. If the label is long, make the pill wider or reduce font size slightly.
- Avoid one-character line breaks in Japanese. Keep short labels on one line; split long headlines into balanced lines only.
- If a CTA includes an arrow/icon, reserve a separate 40-56px area on the right and center the text within the remaining label area.
- Prefer explicit x/y text positioning with text-anchor="middle" for buttons. Use letter-spacing="0"; avoid negative letter spacing.
- Group layers with g id="background", g id="headline", g id="subcopy", g id="meta", g id="cta", g id="decoration" where relevant.
- Keep important text and CTA inside the safe area.
- Prioritize readability, whitespace, and text hierarchy.
- This is an editable design foundation, not a flattened final image.
- note_thumbnail should feel editorial and readable, not like a hard-selling ad.
- seminar_banner should make title, date, benefit, and CTA easy to scan.
- Final SVG must not show internal direction names, role names, or classification badges such as "参加メリット型", "課題共感型", "実務ノウハウ型", "Webinar", "Draft", "Primary", or "Secondary".
- Do not add a top-left pill just to label the concept. Only include user-facing seminar content: headline, subcopy, date/time/place, benefit text, and CTA.
- Keep CTA separated from title, subcopy, and meta by at least 20px. If space is tight, reduce supporting cards before shrinking whitespace.
- Prefer simple, inspectable layouts over decorative panels. The output will be pasted into Figma for review, so avoid dense UI-like widgets.

Forbidden:
- foreignObject
- external CSS
- external image URLs
- script
- animation
- complex filters
- markdown code fences
- visible internal labels, debug labels, or concept labels

Return exactly one SVG string.`;
}

function buildRepairPrompt(direction: Direction, svg: string, errors: string[]): string {
  return `${buildSvgPrompt(direction)}

The previous SVG failed validation:
${errors.map((error) => `- ${error}`).join("\n")}

Repair this SVG while keeping the same direction:
${svg.slice(0, 12_000)}

Return SVG only.`;
}

function createGeneratedNodeName(direction: Direction): string {
  const prefix = direction.contentType === "note_thumbnail" ? "AI_NOTE" : "AI_SEMINAR";
  const suffix = direction.id.replace(/^note_/, "").replace(/^seminar_/, "");
  return `${prefix}_${suffix}`;
}
