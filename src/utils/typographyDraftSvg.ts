import type { LayoutDraftInput } from "../schemas/layoutDraft";

const FONT = "Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif";

export function createTypographyDraftSvg(draft: LayoutDraftInput): string {
  switch (draft.layoutType) {
    case "center_focus":
      return centerFocus(draft);
    case "split_panel":
      return splitPanel(draft);
    case "card_stack":
      return cardStack(draft);
    case "cta_emphasis":
      return ctaEmphasis(draft);
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
    ${label(draft.directionName, 56, 52, "#2563EB")}
    ${textBlock(draft.mainCopy, 64, 126, 52, "#0F172A", "start", 11, 3)}
    <line x1="64" y1="242" x2="276" y2="242" stroke="#FACC15" stroke-width="8" stroke-linecap="round"/>
    ${textBlock(draft.subCopy, 64, 284, 22, "#475569", "start", 21, 2, 650)}
    ${metaRow(64, 342, draft)}
    ${cta(548, 344, draft.cta, "#16A34A")}
  `);
}

function centerFocus(draft: LayoutDraftInput): string {
  return frame("#FFFFFF", `
    ${label(draft.directionName, 310, 52, "#2563EB", "middle")}
    ${textBlock(draft.mainCopy, 400, 142, 54, "#0F172A", "middle", 12, 3)}
    <line x1="284" y1="260" x2="516" y2="260" stroke="#60A5FA" stroke-width="8" stroke-linecap="round"/>
    ${textBlock(draft.subCopy, 400, 306, 21, "#475569", "middle", 23, 2, 620)}
    ${metaRow(186, 356, draft)}
    ${cta(520, 350, draft.cta, "#2563EB")}
  `);
}

function splitPanel(draft: LayoutDraftInput): string {
  return frame("#F7FAFF", `
    ${label(draft.directionName, 56, 52, "#1D4ED8")}
    ${textBlock(draft.mainCopy, 64, 132, 46, "#0F235C", "start", 10, 3)}
    ${textBlock(draft.subCopy, 64, 266, 20, "#475569", "start", 18, 2, 330)}
    <rect x="438" y="78" width="282" height="246" rx="24" fill="#EFF6FF" stroke="#BFDBFE"/>
    <text x="472" y="132" fill="#1D4ED8" font-size="18" font-weight="800" font-family="${FONT}">見るポイント</text>
    ${bullet(472, 174, "主見出しの残り方")}
    ${bullet(472, 216, "CTAの見つけやすさ")}
    ${bullet(472, 258, "情報量と余白")}
    ${metaRow(64, 346, draft)}
    ${cta(536, 346, draft.cta, "#16A34A")}
  `);
}

function cardStack(draft: LayoutDraftInput): string {
  return frame("#F8FAFC", `
    ${label(draft.directionName, 56, 50, "#2563EB")}
    ${textBlock(draft.mainCopy, 64, 118, 40, "#0F172A", "start", 12, 2, 420)}
    ${textBlock(draft.subCopy, 64, 220, 19, "#475569", "start", 22, 2, 410)}
    ${miniCard(492, 92, "01", "要点を整理")}
    ${miniCard(492, 178, "02", "実例で理解")}
    ${miniCard(492, 264, "03", "明日から実践")}
    ${metaRow(64, 342, draft)}
    ${cta(536, 356, draft.cta, "#2563EB")}
  `);
}

function ctaEmphasis(draft: LayoutDraftInput): string {
  return frame("#F7FAFF", `
    ${label(draft.directionName, 56, 52, "#2563EB")}
    ${textBlock(draft.mainCopy, 64, 124, 46, "#0F172A", "start", 11, 3, 500)}
    ${textBlock(draft.subCopy, 64, 274, 21, "#475569", "start", 22, 2, 540)}
    <rect x="474" y="96" width="244" height="244" rx="32" fill="#DBEAFE" opacity="0.75"/>
    <text x="596" y="166" text-anchor="middle" fill="#1D4ED8" font-size="20" font-weight="800" font-family="${FONT}">次の行動</text>
    ${cta(504, 206, draft.cta, "#16A34A", 212, 58)}
    <text x="596" y="298" text-anchor="middle" fill="#334155" font-size="15" font-weight="700" font-family="${FONT}">${escapeXml(draft.date ?? "6.18 WED")}</text>
    ${metaRow(64, 350, draft)}
  `);
}

function metaFirst(draft: LayoutDraftInput): string {
  return frame("#FFFFFF", `
    <rect x="56" y="52" width="688" height="70" rx="22" fill="#EFF6FF" stroke="#BFDBFE"/>
    <text x="90" y="96" fill="#1D4ED8" font-size="26" font-weight="850" font-family="${FONT}">${escapeXml(draft.date ?? "6.18 WED")}</text>
    <text x="262" y="96" fill="#1D4ED8" font-size="23" font-weight="800" font-family="${FONT}">${escapeXml(draft.time ?? "14:00-15:00")}</text>
    <text x="562" y="96" fill="#475569" font-size="18" font-weight="700" font-family="${FONT}">Online</text>
    ${textBlock(draft.mainCopy, 64, 184, 46, "#0F172A", "start", 12, 3, 560)}
    ${textBlock(draft.subCopy, 64, 310, 20, "#475569", "start", 24, 2, 590)}
    ${cta(544, 344, draft.cta, "#2563EB")}
  `);
}

function editorialWhitespace(draft: LayoutDraftInput): string {
  return frame("#FAFAF7", `
    ${label(draft.directionName, 56, 58, "#64748B")}
    ${textBlock(draft.mainCopy, 80, 160, 44, "#111827", "start", 13, 3, 560)}
    <line x1="80" y1="278" x2="180" y2="278" stroke="#2563EB" stroke-width="4" stroke-linecap="round"/>
    ${textBlock(draft.subCopy, 80, 318, 19, "#64748B", "start", 24, 2, 560)}
    ${cta(540, 334, draft.cta, "#2563EB")}
  `);
}

function darkCenter(draft: LayoutDraftInput): string {
  return frame("#0F235C", `
    <circle cx="148" cy="100" r="70" fill="#38BDF8" opacity="0.12"/>
    <circle cx="682" cy="346" r="110" fill="#67E8F9" opacity="0.10"/>
    ${label(draft.directionName, 400, 54, "#67E8F9", "middle")}
    ${textBlock(draft.mainCopy, 400, 150, 56, "#FFFFFF", "middle", 12, 3, 690)}
    <line x1="286" y1="270" x2="514" y2="270" stroke="#FACC15" stroke-width="8" stroke-linecap="round"/>
    ${textBlock(draft.subCopy, 400, 320, 22, "#DCEBFF", "middle", 23, 2, 640)}
    ${cta(500, 366, draft.cta, "#16A34A")}
  `, true);
}

function trustPanel(draft: LayoutDraftInput): string {
  return frame("#F8FAFC", `
    ${label(draft.directionName, 56, 52, "#1D4ED8")}
    <rect x="56" y="90" width="274" height="286" rx="22" fill="#FFFFFF" stroke="#D8E4F5"/>
    <text x="90" y="142" fill="#1E3A8A" font-size="19" font-weight="800" font-family="${FONT}">導入前に整理すること</text>
    ${bullet(90, 186, "不安と前提をそろえる")}
    ${bullet(90, 228, "小さく試す流れを作る")}
    ${bullet(90, 270, "社内共有しやすくする")}
    ${textBlock(draft.mainCopy, 374, 136, 44, "#0F172A", "start", 10, 3, 360)}
    ${textBlock(draft.subCopy, 374, 270, 19, "#475569", "start", 18, 2, 350)}
    ${cta(518, 342, draft.cta, "#2563EB")}
  `);
}

function beginnerSoft(draft: LayoutDraftInput): string {
  return frame("#FFF7ED", `
    <circle cx="678" cy="92" r="54" fill="#FDBA74" opacity="0.36"/>
    <circle cx="720" cy="132" r="28" fill="#93C5FD" opacity="0.38"/>
    ${label(draft.directionName, 56, 54, "#EA580C")}
    ${textBlock(draft.mainCopy, 64, 138, 48, "#7C2D12", "start", 10, 3, 470)}
    ${textBlock(draft.subCopy, 64, 286, 20, "#475569", "start", 22, 2, 520)}
    ${metaRow(64, 344, draft)}
    ${cta(536, 344, draft.cta, "#16A34A")}
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

function label(value: string, x: number, y: number, color: string, anchor: "start" | "middle" = "start"): string {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}" font-size="16" font-weight="850" font-family="${FONT}">${escapeXml(value)}</text>`;
}

function textBlock(
  value: string,
  x: number,
  y: number,
  fontSize: number,
  fill: string,
  anchor: "start" | "middle",
  maxChars: number,
  maxLines = 3,
  width = 640,
): string {
  const lines = splitForSvg(value, maxChars).slice(0, maxLines);
  const tspans = lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : Math.round(fontSize * 1.14)}">${escapeXml(line)}</tspan>`)
    .join("");
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-size="${fontSize}" font-weight="850" font-family="${FONT}" data-width="${width}">${tspans}</text>`;
}

function metaRow(x: number, y: number, draft: LayoutDraftInput): string {
  return `
    <rect x="${x}" y="${y}" width="152" height="42" rx="14" fill="#FFFFFF" stroke="#CBD5E1"/>
    <text x="${x + 24}" y="${y + 27}" fill="#1E3A8A" font-size="15" font-weight="800" font-family="${FONT}">${escapeXml(draft.date ?? "6.18 WED")}</text>
    <rect x="${x + 166}" y="${y}" width="174" height="42" rx="14" fill="#FFFFFF" stroke="#CBD5E1"/>
    <text x="${x + 190}" y="${y + 27}" fill="#1E3A8A" font-size="15" font-weight="800" font-family="${FONT}">${escapeXml(draft.time ?? "14:00 Online")}</text>
  `;
}

function cta(x: number, y: number, value = "無料で参加する", color: string, width = 190, height = 52): string {
  const label = value || "無料で参加する";
  const paddedWidth = Math.max(width, Math.min(248, label.length * 16 + 64));
  const fontSize = label.length > 8 ? 15 : 17;
  const baselineY = y + height / 2 + Math.round(fontSize * 0.38);

  return `
    <rect x="${x}" y="${y}" width="${paddedWidth}" height="${height}" rx="${height / 2}" fill="${color}"/>
    <text x="${x + paddedWidth / 2}" y="${baselineY}" text-anchor="middle" fill="#FFFFFF" font-size="${fontSize}" font-weight="850" letter-spacing="0" font-family="${FONT}">${escapeXml(label)}</text>
  `;
}

function bullet(x: number, y: number, value: string): string {
  return `
    <circle cx="${x + 8}" cy="${y - 5}" r="8" fill="#DBEAFE"/>
    <path d="M${x + 4} ${y - 5}L${x + 8} ${y - 1}L${x + 14} ${y - 10}" stroke="#2563EB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="${x + 28}" y="${y}" fill="#334155" font-size="15" font-weight="700" font-family="${FONT}">${escapeXml(value)}</text>
  `;
}

function miniCard(x: number, y: number, index: string, labelText: string): string {
  return `
    <rect x="${x}" y="${y}" width="220" height="64" rx="18" fill="#FFFFFF" stroke="#D8E4F5"/>
    <circle cx="${x + 32}" cy="${y + 32}" r="18" fill="#EFF6FF"/>
    <text x="${x + 32}" y="${y + 39}" text-anchor="middle" fill="#2563EB" font-size="16" font-weight="850" font-family="${FONT}">${index}</text>
    <text x="${x + 66}" y="${y + 39}" fill="#1E3A8A" font-size="16" font-weight="800" font-family="${FONT}">${escapeXml(labelText)}</text>
  `;
}

function splitForSvg(value: string, maxChars: number): string[] {
  return value
    .split("\n")
    .flatMap((line) => {
      const chars = Array.from(line.trim());
      if (chars.length <= maxChars) return [line.trim()];
      const chunks: string[] = [];
      for (let index = 0; index < chars.length; index += maxChars) {
        chunks.push(chars.slice(index, index + maxChars).join(""));
      }
      return chunks;
    })
    .filter(Boolean);
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
