import type { LayoutDraftInput } from "../schemas/layoutDraft";

const FONT = "Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif";

type Anchor = "start" | "middle";

export function createTypographyDraftSvg(draft: LayoutDraftInput): string {
  switch (draft.layoutType) {
    case "center_focus":
      return centerFocus(draft);
    case "split_panel":
      return splitPanel(draft);
    case "card_stack":
      return cardStack(draft);
    case "cta_emphasis":
      return ctaTextFocus(draft);
    case "editorial_whitespace":
      return editorialWhitespace(draft);
    case "dark_center":
      return darkCenter(draft);
    case "trust_panel":
      return trustPanel(draft);
    case "beginner_soft":
      return beginnerSoft(draft);
    case "meta_first":
      return metaFirst(draft);
    case "left_hero":
    default:
      return leftHero(draft);
  }
}

function leftHero(draft: LayoutDraftInput): string {
  return frame("#F8FAFC", `
    ${roleLabel("MAIN", 64, 72, "#2563EB")}
    ${textBlock(draft.mainCopy, 64, 126, 48, "#0F172A", "start", 11, 3)}
    <line x1="64" y1="250" x2="270" y2="250" stroke="#FACC15" stroke-width="6" stroke-linecap="round"/>
    ${roleLabel("SUB", 64, 292, "#64748B")}
    ${textBlock(draft.subCopy, 64, 326, 20, "#475569", "start", 23, 2)}
    ${plainMeta(64, 392, draft)}
  `);
}

function centerFocus(draft: LayoutDraftInput): string {
  return frame("#FFFFFF", `
    ${roleLabel("MAIN", 400, 76, "#2563EB", "middle")}
    ${textBlock(draft.mainCopy, 400, 144, 50, "#0F172A", "middle", 12, 3)}
    <line x1="284" y1="264" x2="516" y2="264" stroke="#60A5FA" stroke-width="6" stroke-linecap="round"/>
    ${roleLabel("SUB", 400, 306, "#64748B", "middle")}
    ${textBlock(draft.subCopy, 400, 338, 20, "#475569", "middle", 24, 2)}
    ${plainMeta(234, 394, draft)}
  `);
}

function splitPanel(draft: LayoutDraftInput): string {
  return frame("#F7FAFF", `
    <line x1="424" y1="72" x2="424" y2="354" stroke="#D8E4F5"/>
    ${roleLabel("MAIN", 64, 78, "#1D4ED8")}
    ${textBlock(draft.mainCopy, 64, 136, 42, "#0F235C", "start", 10, 3)}
    ${roleLabel("SUB", 64, 282, "#64748B")}
    ${textBlock(draft.subCopy, 64, 314, 19, "#475569", "start", 18, 2)}
    ${roleLabel("SUPPORT", 470, 98, "#1D4ED8")}
    ${supportLine(470, 146, "得られること")}
    ${supportLine(470, 196, "参加判断の理由")}
    ${supportLine(470, 246, "次に試せる行動")}
    ${plainMeta(64, 392, draft)}
  `);
}

function cardStack(draft: LayoutDraftInput): string {
  return frame("#F8FAFC", `
    ${roleLabel("MAIN", 64, 76, "#2563EB")}
    ${textBlock(draft.mainCopy, 64, 128, 40, "#0F172A", "start", 12, 2)}
    ${roleLabel("SUB", 64, 238, "#64748B")}
    ${textBlock(draft.subCopy, 64, 270, 19, "#475569", "start", 23, 2)}
    ${outlineCard(500, 94, "01", "要点")}
    ${outlineCard(500, 176, "02", "実例")}
    ${outlineCard(500, 258, "03", "実践")}
    ${plainMeta(64, 392, draft)}
  `);
}

function ctaTextFocus(draft: LayoutDraftInput): string {
  return frame("#F7FAFF", `
    ${roleLabel("MAIN", 64, 76, "#2563EB")}
    ${textBlock(draft.mainCopy, 64, 128, 42, "#0F172A", "start", 11, 3)}
    ${roleLabel("SUB", 64, 286, "#64748B")}
    ${textBlock(draft.subCopy, 64, 318, 19, "#475569", "start", 24, 2)}
    <rect x="504" y="108" width="202" height="148" rx="18" fill="#EFF6FF" stroke="#BFDBFE"/>
    ${roleLabel("CTA TEXT", 606, 154, "#1D4ED8", "middle")}
    ${textBlock(draft.cta ?? "無料で参加する", 606, 200, 24, "#0F235C", "middle", 10, 2, 176)}
    ${plainMeta(64, 392, draft)}
  `);
}

function metaFirst(draft: LayoutDraftInput): string {
  return frame("#FFFFFF", `
    <rect x="64" y="64" width="672" height="72" rx="18" fill="#EFF6FF" stroke="#BFDBFE"/>
    ${roleLabel("META", 88, 92, "#1D4ED8")}
    <text x="88" y="120" fill="#1E3A8A" font-size="20" font-weight="850" font-family="${FONT}">${escapeXml(draft.date ?? "6.18 WED")} / ${escapeXml(draft.time ?? "14:00-15:00")}</text>
    ${roleLabel("MAIN", 64, 184, "#2563EB")}
    ${textBlock(draft.mainCopy, 64, 236, 42, "#0F172A", "start", 12, 3)}
    ${roleLabel("SUB", 64, 354, "#64748B")}
    ${textBlock(draft.subCopy, 64, 386, 18, "#475569", "start", 25, 1)}
  `);
}

function editorialWhitespace(draft: LayoutDraftInput): string {
  return frame("#FAFAF7", `
    ${roleLabel("MAIN", 92, 104, "#64748B")}
    ${textBlock(draft.mainCopy, 92, 170, 42, "#111827", "start", 13, 3)}
    <line x1="92" y1="288" x2="192" y2="288" stroke="#2563EB" stroke-width="4" stroke-linecap="round"/>
    ${roleLabel("SUB", 92, 328, "#64748B")}
    ${textBlock(draft.subCopy, 92, 360, 19, "#64748B", "start", 25, 2)}
  `);
}

function darkCenter(draft: LayoutDraftInput): string {
  return frame("#0F235C", `
    <circle cx="148" cy="100" r="70" fill="#38BDF8" opacity="0.12"/>
    <circle cx="682" cy="346" r="110" fill="#67E8F9" opacity="0.10"/>
    ${roleLabel("MAIN", 400, 76, "#67E8F9", "middle")}
    ${textBlock(draft.mainCopy, 400, 148, 50, "#FFFFFF", "middle", 12, 3)}
    <line x1="286" y1="264" x2="514" y2="264" stroke="#FACC15" stroke-width="6" stroke-linecap="round"/>
    ${roleLabel("SUB", 400, 308, "#BAE6FD", "middle")}
    ${textBlock(draft.subCopy, 400, 340, 20, "#DCEBFF", "middle", 24, 2)}
    ${plainMeta(234, 394, draft, true)}
  `, true);
}

function trustPanel(draft: LayoutDraftInput): string {
  return frame("#F8FAFC", `
    <rect x="64" y="72" width="246" height="272" rx="18" fill="#FFFFFF" stroke="#D8E4F5"/>
    ${roleLabel("SUPPORT", 94, 116, "#1D4ED8")}
    ${supportLine(94, 164, "導入前の不安")}
    ${supportLine(94, 214, "小さな実践")}
    ${supportLine(94, 264, "社内共有")}
    ${roleLabel("MAIN", 366, 86, "#2563EB")}
    ${textBlock(draft.mainCopy, 366, 142, 40, "#0F172A", "start", 10, 3)}
    ${roleLabel("SUB", 366, 296, "#64748B")}
    ${textBlock(draft.subCopy, 366, 328, 18, "#475569", "start", 19, 2)}
    ${plainMeta(366, 392, draft)}
  `);
}

function beginnerSoft(draft: LayoutDraftInput): string {
  return frame("#FFF7ED", `
    <circle cx="678" cy="92" r="54" fill="#FDBA74" opacity="0.32"/>
    <circle cx="720" cy="132" r="28" fill="#93C5FD" opacity="0.36"/>
    ${roleLabel("MAIN", 64, 78, "#EA580C")}
    ${textBlock(draft.mainCopy, 64, 138, 44, "#7C2D12", "start", 10, 3)}
    ${roleLabel("SUB", 64, 292, "#9A3412")}
    ${textBlock(draft.subCopy, 64, 324, 19, "#475569", "start", 23, 2)}
    ${plainMeta(64, 392, draft)}
  `);
}

function frame(background: string, content: string, dark = false): string {
  const stroke = dark ? "rgba(255,255,255,0.16)" : "#D8E4F5";
  return `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect width="800" height="450" rx="24" fill="${background}"/>
    <rect x="24" y="24" width="752" height="402" rx="20" fill="none" stroke="${stroke}"/>
    ${content}
  </svg>`;
}

function roleLabel(value: string, x: number, y: number, color: string, anchor: Anchor = "start"): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="12" font-weight="850" letter-spacing="0" font-family="${FONT}">${escapeXml(value)}</text>`;
}

function textBlock(
  value: string,
  x: number,
  y: number,
  fontSize: number,
  fill: string,
  anchor: Anchor,
  maxChars: number,
  maxLines = 3,
  width = 640,
): string {
  const lines = splitForSvg(value, maxChars).slice(0, maxLines);
  const lineHeight = Math.round(fontSize * 1.16);
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("");
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-size="${fontSize}" font-weight="850" font-family="${FONT}" data-width="${width}">${tspans}</text>`;
}

function plainMeta(x: number, y: number, draft: LayoutDraftInput, dark = false): string {
  const color = dark ? "#DCEBFF" : "#475569";
  const cta = draft.cta ? ` / CTA: ${draft.cta}` : "";
  return `<g id="meta">
    <text x="${x}" y="${y}" fill="${color}" font-size="16" font-weight="800" font-family="${FONT}">${escapeXml(draft.date ?? "6.18 WED")} / ${escapeXml(draft.time ?? "14:00-15:00")}${escapeXml(cta)}</text>
  </g>`;
}

function supportLine(x: number, y: number, value: string): string {
  return `<g>
    <line x1="${x}" y1="${y}" x2="${x + 160}" y2="${y}" stroke="#BFDBFE" stroke-width="2"/>
    <text x="${x}" y="${y + 24}" fill="#334155" font-size="16" font-weight="800" font-family="${FONT}">${escapeXml(value)}</text>
  </g>`;
}

function outlineCard(x: number, y: number, index: string, value: string): string {
  return `<g>
    <rect x="${x}" y="${y}" width="196" height="58" rx="14" fill="#FFFFFF" stroke="#D8E4F5"/>
    <text x="${x + 22}" y="${y + 36}" fill="#2563EB" font-size="18" font-weight="850" font-family="${FONT}">${index}</text>
    <text x="${x + 66}" y="${y + 36}" fill="#1E3A8A" font-size="17" font-weight="850" font-family="${FONT}">${escapeXml(value)}</text>
  </g>`;
}

function splitForSvg(value: string, maxChars: number): string[] {
  return value
    .split("\n")
    .flatMap((line) => splitNaturalLine(line.trim(), maxChars))
    .filter(Boolean);
}

function splitNaturalLine(value: string, maxChars: number): string[] {
  const chars = Array.from(value);
  if (chars.length <= maxChars) return value ? [value] : [];

  const lineCount = Math.ceil(chars.length / maxChars);
  const target = Math.ceil(chars.length / lineCount);
  const lines: string[] = [];
  let start = 0;

  while (start < chars.length) {
    const remaining = chars.length - start;
    if (remaining <= maxChars) {
      lines.push(chars.slice(start).join(""));
      break;
    }

    const preferred = findNaturalBreak(chars, start, Math.min(chars.length, start + target), maxChars);
    lines.push(chars.slice(start, preferred).join(""));
    start = preferred;
  }

  return rebalanceShortTail(lines);
}

function findNaturalBreak(chars: string[], start: number, targetEnd: number, maxChars: number): number {
  const minEnd = Math.min(chars.length - 4, start + Math.max(5, Math.floor(maxChars * 0.62)));
  const maxEnd = Math.min(chars.length - 4, start + maxChars);
  const candidates: Array<{ index: number; score: number }> = [];

  for (let index = minEnd; index <= maxEnd; index += 1) {
    const prev = chars[index - 1] ?? "";
    const next = chars[index] ?? "";
    let score = Math.abs(index - targetEnd);
    if (/[、。・／\/]/.test(prev)) score -= 8;
    if (/[でのをにへとはがもと、。]/.test(prev)) score -= 5;
    if (/[A-Za-z0-9]/.test(prev) && /[A-Za-z0-9]/.test(next)) score += 12;
    if (/[第入一門歩]/.test(prev) && /[第入一門歩]/.test(next)) score += 10;
    candidates.push({ index, score });
  }

  candidates.sort((a, b) => a.score - b.score);
  return candidates[0]?.index ?? Math.min(chars.length, start + maxChars);
}

function rebalanceShortTail(lines: string[]): string[] {
  if (lines.length < 2) return lines;
  const tail = Array.from(lines[lines.length - 1]);
  if (tail.length >= 4) return lines;

  const previous = Array.from(lines[lines.length - 2]);
  const borrow = Math.min(4 - tail.length, Math.max(0, previous.length - 5));
  if (borrow <= 0) return lines;

  lines[lines.length - 2] = previous.slice(0, previous.length - borrow).join("");
  lines[lines.length - 1] = previous.slice(previous.length - borrow).join("") + lines[lines.length - 1];
  return lines.filter(Boolean);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
