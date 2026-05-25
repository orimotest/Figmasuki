import { getGeneratedSvgSample } from "../../data/demo/generatedSvgSamples";
import type { Direction } from "../../schemas/direction";
import type { SvgCandidate } from "../../schemas/svg";
import { validateSvg } from "../../utils/svgValidator";

export async function demoGenerateSvg(direction: Direction): Promise<SvgCandidate> {
  const sample = getGeneratedSvgSample(direction.contentType, direction.id);
  if (!sample) {
    throw new Error(`Demo SVG was not found for direction: ${direction.id}`);
  }

  const svg = shouldUseSampleAsIs(direction.id) ? sample : injectDirectionCopy(sample, direction);
  const name = createGeneratedNodeName(direction);
  return {
    id: `svg_${direction.id}`,
    directionId: direction.id,
    contentType: direction.contentType,
    name,
    svg,
    width: 800,
    height: 450,
    previewLabel: direction.title,
    validation: validateSvg(svg),
    meta: {
      layoutType: direction.layoutType,
      provider: "demo",
      generatedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
  };
}

function createGeneratedNodeName(direction: Direction): string {
  const prefix = direction.contentType === "note_thumbnail" ? "AI_NOTE" : "AI_SEMINAR";
  const suffix = direction.id.replace(/^note_/, "").replace(/^seminar_/, "");
  return `${prefix}_${suffix}`;
}

function injectDirectionCopy(svg: string, direction: Direction): string {
  const headline = renderHeadlineGroup(direction);
  const withHeadline = svg.replace(/<g id="headline">[\s\S]*?<\/g>/, headline);

  if (direction.contentType === "seminar_banner" && direction.copy.cta) {
    return withHeadline.replace(/<g id="cta">[\s\S]*?<\/g>/, renderCtaGroup(direction));
  }

  return withHeadline;
}

function shouldUseSampleAsIs(directionId: string): boolean {
  return directionId === "seminar_problem_01";
}

function renderHeadlineGroup(direction: Direction): string {
  const layout = getHeadlineLayout(direction.layoutType);
  const lines = direction.copy.main.split("\n").filter(Boolean).slice(0, 3);
  const escapedSub = escapeXml(direction.copy.sub);
  const tspanLines = lines
    .map((line, index) => `<tspan x="${layout.x}" dy="${index === 0 ? 0 : layout.lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");

  return `<g id="headline">
    <text x="${layout.x}" y="${layout.y}" fill="${layout.fill}" font-family="Inter, Arial, sans-serif" font-size="${layout.fontSize}" font-weight="${layout.weight}">${tspanLines}</text>
    <text x="${layout.x + 4}" y="${layout.subY}" fill="${layout.subFill}" font-family="Inter, Arial, sans-serif" font-size="${layout.subSize}" font-weight="650">${escapedSub}</text>
  </g>`;
}

function renderCtaGroup(direction: Direction): string {
  const layout = getCtaLayout(direction.layoutType);
  return `<g id="cta">
    <rect x="${layout.x}" y="${layout.y}" width="${layout.width}" height="${layout.height}" rx="${layout.height / 2}" fill="${layout.fill}"/>
    <text x="${layout.textX}" y="${layout.textY}" fill="${layout.textFill}" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="850">${escapeXml(direction.copy.cta ?? "")}</text>
  </g>`;
}

function getHeadlineLayout(layoutType: string): {
  x: number;
  y: number;
  subY: number;
  fontSize: number;
  lineHeight: number;
  subSize: number;
  weight: number;
  fill: string;
  subFill: string;
} {
  if (layoutType === "editorial_whitespace") {
    return { x: 136, y: 178, subY: 303, fontSize: 52, lineHeight: 64, subSize: 22, weight: 740, fill: "#1F2937", subFill: "#64748B" };
  }
  if (layoutType === "practical_index") {
    return { x: 92, y: 138, subY: 256, fontSize: 50, lineHeight: 60, subSize: 22, weight: 820, fill: "#FFFFFF", subFill: "#BAE6FD" };
  }
  if (layoutType === "statement_contrast") {
    return { x: 86, y: 164, subY: 286, fontSize: 43, lineHeight: 56, subSize: 21, weight: 850, fill: "#111827", subFill: "#475569" };
  }
  if (layoutType === "quiet_statement") {
    return { x: 146, y: 204, subY: 309, fontSize: 42, lineHeight: 54, subSize: 21, weight: 760, fill: "#111827", subFill: "#64748B" };
  }
  if (layoutType === "problem_to_cta") {
    return { x: 88, y: 148, subY: 272, fontSize: 54, lineHeight: 64, subSize: 22, weight: 850, fill: "#FFFFFF", subFill: "#DBEAFE" };
  }
  if (layoutType === "benefit_first") {
    return { x: 94, y: 154, subY: 278, fontSize: 43, lineHeight: 54, subSize: 21, weight: 850, fill: "#0F172A", subFill: "#334155" };
  }
  if (layoutType === "practical_blocks") {
    return { x: 94, y: 120, subY: 210, fontSize: 32, lineHeight: 42, subSize: 24, weight: 850, fill: "#FFFFFF", subFill: "#0F172A" };
  }
  if (layoutType === "trust_editorial") {
    return { x: 94, y: 208, subY: 302, fontSize: 43, lineHeight: 54, subSize: 20, weight: 850, fill: "#111827", subFill: "#4B5563" };
  }
  if (layoutType === "beginner_friendly") {
    return { x: 88, y: 186, subY: 296, fontSize: 43, lineHeight: 54, subSize: 21, weight: 850, fill: "#7C2D12", subFill: "#9A3412" };
  }
  return { x: 88, y: 132, subY: 324, fontSize: 46, lineHeight: 56, subSize: 21, weight: 820, fill: "#FFFFFF", subFill: "#BAE6FD" };
}

function getCtaLayout(layoutType: string): {
  x: number;
  y: number;
  width: number;
  height: number;
  textX: number;
  textY: number;
  fill: string;
  textFill: string;
} {
  if (layoutType === "benefit_first") {
    return { x: 98, y: 322, width: 170, height: 48, textX: 124, textY: 353, fill: "#60A5FA", textFill: "#FFFFFF" };
  }
  if (layoutType === "practical_blocks") {
    return { x: 552, y: 365, width: 156, height: 42, textX: 580, textY: 392, fill: "#06B6D4", textFill: "#FFFFFF" };
  }
  if (layoutType === "trust_editorial") {
    return { x: 624, y: 322, width: 96, height: 44, textX: 643, textY: 350, fill: "#93C5FD", textFill: "#111827" };
  }
  if (layoutType === "beginner_friendly") {
    return { x: 548, y: 322, width: 168, height: 52, textX: 578, textY: 355, fill: "#2563EB", textFill: "#FFFFFF" };
  }
  return { x: 92, y: 326, width: 164, height: 50, textX: 122, textY: 358, fill: "#F97316", textFill: "#FFFFFF" };
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
