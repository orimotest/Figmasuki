import type { NormalizedCreativeInput, RequirementBlock } from "../../schemas/input";
import { parseMarkdown } from "../../utils/markdown/parseMarkdown";

const FONT_REGULAR: FontName = { family: "Inter", style: "Regular" };
const FONT_BOLD: FontName = { family: "Inter", style: "Bold" };

const COLORS = {
  board: { r: 1, g: 1, b: 1 },
  card: { r: 0.984, g: 0.988, b: 0.984 },
  code: { r: 0.071, g: 0.094, b: 0.122 },
  border: { r: 0.86, g: 0.88, b: 0.9 },
  text: { r: 0.12, g: 0.16, b: 0.2 },
  muted: { r: 0.42, g: 0.45, b: 0.42 },
  primary: { r: 0.122, g: 0.435, b: 0.357 },
  primarySoft: { r: 0.91, g: 0.957, b: 0.937 },
};

type RenderRequirementOptions = {
  x?: number;
  y?: number;
  zoom?: boolean;
};

export async function renderRequirementDocumentBoard(input: NormalizedCreativeInput, options: RenderRequirementOptions = {}): Promise<FrameNode> {
  await Promise.all([figma.loadFontAsync(FONT_REGULAR), figma.loadFontAsync(FONT_BOLD)]);

  const board = createAutoFrame("00 Requirement Document Board", 900, COLORS.board);
  board.x = options.x ?? figma.viewport.center.x - 450;
  board.y = options.y ?? figma.viewport.center.y - 360;
  board.paddingTop = 28;
  board.paddingRight = 28;
  board.paddingBottom = 28;
  board.paddingLeft = 28;
  board.itemSpacing = 16;
  board.strokes = [{ type: "SOLID", color: COLORS.border }];
  board.strokeWeight = 1;
  board.cornerRadius = 18;

  board.appendChild(createText("Requirement Document", 24, true, 844, COLORS.text));
  board.appendChild(createText("入力要件とAIが解釈した制作前提を、制作開始前にレビューできる形で残します。", 12, false, 844, COLORS.muted));
  board.appendChild(createMetaGrid(input));

  const blocks = input.requirementBlocks?.length ? input.requirementBlocks : input.markdownText ? parseMarkdown(input.markdownText) : createFallbackBlocks(input);
  const sections = createAutoFrame("Requirement Sections", 844, COLORS.board);
  sections.layoutMode = "VERTICAL";
  sections.itemSpacing = 10;
  sections.fills = [];
  blocks.slice(0, 24).forEach((block) => sections.appendChild(createBlockCard(block)));
  board.appendChild(sections);

  if (input.assumptions.length || input.missingInfo.length) {
    board.appendChild(createReviewNotes(input));
  }

  figma.currentPage.appendChild(board);
  if (options.zoom !== false) {
    figma.currentPage.selection = [board];
    figma.viewport.scrollAndZoomIntoView([board]);
  }
  return board;
}

function createMetaGrid(input: NormalizedCreativeInput): FrameNode {
  const grid = createAutoFrame("Requirement Summary", 844, COLORS.primarySoft);
  grid.layoutMode = "HORIZONTAL";
  grid.counterAxisSizingMode = "AUTO";
  grid.itemSpacing = 10;
  grid.paddingTop = 14;
  grid.paddingRight = 14;
  grid.paddingBottom = 14;
  grid.paddingLeft = 14;
  grid.cornerRadius = 12;
  grid.strokes = [{ type: "SOLID", color: COLORS.border }];
  grid.strokeWeight = 1;
  [
    ["Project", input.projectName],
    ["Source", input.inputSource],
    ["Target", input.target ?? "未指定"],
    ["Goal", input.goal ?? "未指定"],
  ].forEach(([label, value]) => grid.appendChild(createMetric(label, value)));
  return grid;
}

function createMetric(label: string, value: string): FrameNode {
  const frame = createAutoFrame(`Metric / ${label}`, 196, { r: 1, g: 1, b: 1 });
  frame.paddingTop = 10;
  frame.paddingRight = 10;
  frame.paddingBottom = 10;
  frame.paddingLeft = 10;
  frame.itemSpacing = 5;
  frame.cornerRadius = 9;
  frame.appendChild(createText(label, 9, true, 176, COLORS.primary));
  frame.appendChild(createText(value || "未指定", 11, false, 176, COLORS.text));
  return frame;
}

function createBlockCard(block: RequirementBlock): FrameNode {
  if (block.type === "table" && block.rows?.length) return createTableCard(block);
  const card = createAutoFrame(`Requirement / ${block.type}`, 844, block.type === "code" ? COLORS.code : COLORS.card);
  card.paddingTop = 12;
  card.paddingRight = 14;
  card.paddingBottom = 12;
  card.paddingLeft = 14;
  card.itemSpacing = 7;
  card.cornerRadius = 10;
  card.strokes = [{ type: "SOLID", color: COLORS.border }];
  card.strokeWeight = 1;
  const dark = block.type === "code";
  card.appendChild(createText(getBlockLabel(block), 9, true, 816, dark ? { r: 0.75, g: 0.85, b: 0.78 } : COLORS.primary));
  if (block.items?.length) {
    block.items.slice(0, 8).forEach((item) => card.appendChild(createText(`- ${item}`, 11, false, 816, dark ? { r: 0.92, g: 0.94, b: 0.9 } : COLORS.text)));
  } else {
    card.appendChild(createText(block.text, block.type === "heading" ? 18 : 11, block.type === "heading", 816, dark ? { r: 0.92, g: 0.94, b: 0.9 } : COLORS.text));
  }
  return card;
}

function createTableCard(block: RequirementBlock): FrameNode {
  const card = createAutoFrame("Requirement / table", 844, COLORS.card);
  card.paddingTop = 12;
  card.paddingRight = 14;
  card.paddingBottom = 12;
  card.paddingLeft = 14;
  card.itemSpacing = 7;
  card.cornerRadius = 10;
  card.strokes = [{ type: "SOLID", color: COLORS.border }];
  card.strokeWeight = 1;
  card.appendChild(createText("表", 9, true, 816, COLORS.primary));
  block.rows?.slice(0, 8).forEach((cells, rowIndex) => {
    const row = createAutoFrame(`Table Row ${rowIndex + 1}`, 816, rowIndex === 0 ? COLORS.primarySoft : { r: 1, g: 1, b: 1 });
    row.layoutMode = "HORIZONTAL";
    row.itemSpacing = 6;
    row.paddingTop = 7;
    row.paddingRight = 8;
    row.paddingBottom = 7;
    row.paddingLeft = 8;
    row.cornerRadius = 6;
    cells.slice(0, 4).forEach((cell) => row.appendChild(createText(cell, 10, rowIndex === 0, Math.floor(780 / Math.min(cells.length, 4)), COLORS.text)));
    card.appendChild(row);
  });
  return card;
}

function createReviewNotes(input: NormalizedCreativeInput): FrameNode {
  const card = createAutoFrame("Review Notes", 844, COLORS.primarySoft);
  card.paddingTop = 12;
  card.paddingRight = 14;
  card.paddingBottom = 12;
  card.paddingLeft = 14;
  card.itemSpacing = 8;
  card.cornerRadius = 10;
  card.appendChild(createText("確認メモ", 12, true, 816, COLORS.primary));
  input.missingInfo.forEach((item) => card.appendChild(createText(`不足: ${item}`, 10, false, 816, COLORS.text)));
  input.assumptions.forEach((item) => card.appendChild(createText(`仮説: ${item}`, 10, false, 816, COLORS.text)));
  return card;
}

function createFallbackBlocks(input: NormalizedCreativeInput): RequirementBlock[] {
  return [
    { id: "fallback_goal", type: "heading", level: 1, text: input.projectName },
    { id: "fallback_brief", type: "paragraph", text: input.briefText ?? input.fixedCopy?.main ?? "要件テキストは未入力です。" },
  ];
}

function createAutoFrame(name: string, width: number, fill: RGB): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.resize(width, 1);
  frame.layoutMode = "VERTICAL";
  frame.primaryAxisSizingMode = "AUTO";
  frame.counterAxisSizingMode = "FIXED";
  frame.fills = [{ type: "SOLID", color: fill }];
  frame.clipsContent = false;
  return frame;
}

function createText(characters: string, size: number, bold: boolean, width: number, color: RGB): TextNode {
  const text = figma.createText();
  text.name = bold ? "Text / Bold" : "Text";
  text.fontName = bold ? FONT_BOLD : FONT_REGULAR;
  text.fontSize = size;
  text.fills = [{ type: "SOLID", color }];
  text.textAutoResize = "HEIGHT";
  text.resize(width, Math.max(18, size + 8));
  text.characters = characters;
  return text;
}

function getBlockLabel(block: RequirementBlock): string {
  const labels: Record<RequirementBlock["type"], string> = {
    heading: `見出し${block.level ?? ""}`,
    paragraph: "本文",
    list: "リスト",
    ordered_list: "番号付きリスト",
    quote: "引用",
    code: "コード",
    table: "表",
  };
  return labels[block.type];
}
