import type { BackgroundResult } from "../../schemas/background";
import type { ComparisonResult } from "../../schemas/comparison";
import type { DiagnosisResult } from "../../schemas/diagnosis";
import type { Direction } from "../../schemas/direction";
import type { ProjectData } from "../../schemas/project";
import type { SvgCandidate } from "../../schemas/svg";

const COLORS = {
  canvas: { r: 0.957, g: 0.969, b: 0.984 },
  board: { r: 1, g: 1, b: 1 },
  card: { r: 0.984, g: 0.988, b: 0.996 },
  border: { r: 0.859, g: 0.886, b: 0.925 },
  text: { r: 0.086, g: 0.125, b: 0.2 },
  muted: { r: 0.392, g: 0.455, b: 0.545 },
  blue: { r: 0.082, g: 0.369, b: 0.937 },
  paleBlue: { r: 0.929, g: 0.961, b: 1 },
  green: { r: 0.086, g: 0.514, b: 0.278 },
};

const FONT_REGULAR: FontName = { family: "Inter", style: "Regular" };
const FONT_BOLD: FontName = { family: "Inter", style: "Bold" };

type TextOptions = {
  size?: number;
  color?: RGB;
  bold?: boolean;
  width?: number;
  height?: number;
};

export async function renderProcessBoard(project: ProjectData): Promise<FrameNode> {
  await loadFonts();
  const root = createFrame(`AI Process Board / ${project.projectName}`, 0, 0, 6720, 960, COLORS.canvas);
  const startX = figma.viewport.center.x - 360;
  const startY = figma.viewport.center.y - 260;
  root.x = startX;
  root.y = startY;

  const sections: FrameNode[] = [
    renderProjectBoard(project),
    renderCopyBoard(project.copyDirections, project),
    renderLayoutBoard(project),
    renderCandidateBoard(project.svgCandidates, project.copyDirections),
    renderDiagnosisBoard(project.diagnosisResults),
    renderCompareBoard(project.comparisonResult),
    renderFinishBoard(project.backgroundResult, project.comparisonResult),
  ];

  sections.forEach((section, index) => {
    section.x = 40 + index * 940;
    section.y = 40;
    root.appendChild(section);
  });

  figma.currentPage.appendChild(root);
  figma.currentPage.selection = [root];
  figma.viewport.scrollAndZoomIntoView([root]);
  return root;
}

export async function renderStandaloneDiagnosisBoard(result: DiagnosisResult): Promise<FrameNode> {
  await loadFonts();
  const board = renderDiagnosisBoard([result]);
  board.x = figma.viewport.center.x - 400;
  board.y = figma.viewport.center.y - 300;
  figma.currentPage.appendChild(board);
  figma.currentPage.selection = [board];
  figma.viewport.scrollAndZoomIntoView([board]);
  return board;
}

export async function renderStandaloneCompareBoard(result: ComparisonResult): Promise<FrameNode> {
  await loadFonts();
  const board = renderCompareBoard(result);
  board.x = figma.viewport.center.x - 400;
  board.y = figma.viewport.center.y - 300;
  figma.currentPage.appendChild(board);
  figma.currentPage.selection = [board];
  figma.viewport.scrollAndZoomIntoView([board]);
  return board;
}

export async function renderStandaloneFinishBoard(result: BackgroundResult, comparison?: ComparisonResult): Promise<FrameNode> {
  await loadFonts();
  const board = renderFinishBoard(result, comparison);
  board.x = figma.viewport.center.x - 400;
  board.y = figma.viewport.center.y - 300;
  figma.currentPage.appendChild(board);
  figma.currentPage.selection = [board];
  figma.viewport.scrollAndZoomIntoView([board]);
  return board;
}

export function renderProjectBoard(project: ProjectData): FrameNode {
  const board = createBoard("Project Header", "入力要件と生成条件をレビューする起点です。");
  let y = 112;
  y = addKeyValueCard(board, 28, y, "プロジェクト名", project.projectName);
  y = addKeyValueCard(board, 28, y, "用途", project.contentType === "seminar_banner" ? "セミナー / ウェビナーバナー" : "note / ブログサムネイル");
  y = addKeyValueCard(board, 28, y, "サイズ", `${project.canvasSize.width} x ${project.canvasSize.height}`);
  y = addKeyValueCard(board, 28, y, "入力タイプ", project.inputMode === "fixed_copy" ? "確定コピーから作成" : "要件から作成");
  y = addKeyValueCard(board, 28, y, "要件要約", project.inputSummary.brief);
  y = addKeyValueCard(board, 28, y, "ターゲット", project.inputSummary.targetAudience ?? "未指定");
  y = addKeyValueCard(board, 28, y, "ゴール", project.inputSummary.goal ?? "未指定");
  y = addKeyValueCard(board, 28, y, "生成日時", new Date(project.createdAt).toLocaleString("ja-JP"));
  addKeyValueCard(board, 28, y, "Provider", project.providerMeta.mode);
  return board;
}

export function renderCopyBoard(directions: Direction[], project?: ProjectData): FrameNode {
  const board = createBoard("Copy Exploration Board", `${project?.contentType === "seminar_banner" ? "セミナー" : "note"}向けに、30案を探索して5方向へ整理したコピー案です。`);
  addPill(board, 28, 94, "30案を探索 -> 5方向を抽出", COLORS.blue);
  let y = 134;
  directions.slice(0, 5).forEach((direction, index) => {
    const card = createCard(28, y, 784, 122);
    board.appendChild(card);
    addText(card, `${index + 1}. ${direction.title}`, 18, 16, { size: 16, bold: true, width: 740 });
    addText(card, direction.intent, 18, 42, { size: 11, color: COLORS.muted, width: 740, height: 28 });
    addText(card, `Main: ${direction.copy.main.replace(/\n/g, " / ")}`, 18, 72, { size: 12, width: 740 });
    addText(card, `Sub: ${direction.copy.sub}`, 18, 92, { size: 11, color: COLORS.muted, width: 520 });
    if (direction.copy.cta) addPill(card, 604, 88, direction.copy.cta, COLORS.green);
    y += 138;
  });
  return board;
}

export function renderLayoutBoard(project: ProjectData): FrameNode {
  const board = createBoard("Layout Strategy Board", "コピー方向性ごとの構図、優先順位、色、背景方針を並べます。");
  let y = 112;
  project.layoutStrategies.slice(0, 5).forEach((strategy, index) => {
    const card = createCard(28, y, 784, 124);
    board.appendChild(card);
    addText(card, `${index + 1}. ${strategy.directionName}`, 18, 16, { size: 15, bold: true, width: 360 });
    addPill(card, 602, 14, strategy.layoutType, COLORS.blue);
    addText(card, `構図: ${strategy.composition}`, 18, 44, { size: 11, width: 740, height: 28 });
    addText(card, `優先順位: ${strategy.hierarchy.join(" > ")}`, 18, 76, { size: 11, width: 740 });
    addText(card, `色: ${strategy.colorDirection}`, 18, 96, { size: 10, color: COLORS.muted, width: 740 });
    y += 140;
  });
  return board;
}

export function renderCandidateBoard(candidates: SvgCandidate[], directions: Direction[]): FrameNode {
  const board = createBoard("Layout Candidates Board", "実際のSVG候補をカード内に整列し、方向性とセットで確認します。");
  const byDirection = new Map(directions.map((direction) => [direction.id, direction]));
  const positions = [
    [28, 112],
    [442, 112],
    [28, 392],
    [442, 392],
    [28, 672],
  ] as const;

  candidates.slice(0, 5).forEach((candidate, index) => {
    const [x, y] = positions[index];
    const card = createCard(x, y, 370, 246);
    board.appendChild(card);
    const svgNode = figma.createNodeFromSvg(candidate.svg);
    svgNode.name = candidate.name;
    svgNode.x = 14;
    svgNode.y = 42;
    svgNode.resize(320, 180);
    card.appendChild(svgNode);
    const direction = byDirection.get(candidate.directionId);
    addText(card, direction?.title ?? candidate.name, 14, 14, { size: 13, bold: true, width: 260 });
    addPill(card, 262, 12, candidate.directionId, COLORS.blue, 84);
    addText(card, direction?.summary ?? candidate.name, 14, 224, { size: 10, color: COLORS.muted, width: 330 });
  });
  return board;
}

export function renderDiagnosisBoard(results: DiagnosisResult[]): FrameNode {
  const board = createBoard("Diagnosis Board", "選択案の伝わり方と、最初に直すならどこかを整理します。");
  const result = results[results.length - 1];
  if (!result) {
    addEmpty(board, "まだ診断結果がありません。診断を実行するとここにカードが追加されます。");
    return board;
  }

  let y = 112;
  y = addKeyValueCard(board, 28, y, "対象案", result.frameName);
  y = addKeyValueCard(board, 28, y, "診断概要", result.summary);
  y = addKeyValueCard(board, 28, y, "最初に伝わること", result.firstImpression);
  y = addListCard(board, 28, y, "強い点", result.strengths);
  y = addListCard(board, 28, y, "気になる点", result.concerns);
  y = addListCard(board, 28, y, "最初に直すなら", result.fixPriority.map((item) => `${item.target}: ${item.suggestion}`));
  addListCard(board, 28, y, "この指摘から作れる派生案", result.rewriteInstructions.map((item) => `${item.label}: ${item.instruction}`));
  return board;
}

export function renderCompareBoard(result?: ComparisonResult): FrameNode {
  const board = createBoard("Compare Board", "複数案の役割、強み、懸念、背景生成briefをレビューします。");
  if (!result) {
    addEmpty(board, "まだ比較結果がありません。比較を実行するとここに表が追加されます。");
    return board;
  }

  let y = 112;
  y = addKeyValueCard(board, 28, y, "比較概要", result.comparisonSummary);
  const table = createCard(28, y, 784, 238);
  board.appendChild(table);
  addText(table, "比較表", 18, 16, { size: 15, bold: true });
  let rowY = 48;
  result.frameRoles.slice(0, 5).forEach((role) => {
    addText(table, role.frameName, 18, rowY, { size: 11, bold: true, width: 130 });
    addText(table, role.role, 156, rowY, { size: 10, width: 110 });
    addText(table, role.strength, 276, rowY, { size: 10, width: 190 });
    addText(table, role.risk, 474, rowY, { size: 10, color: COLORS.muted, width: 288, height: 34 });
    rowY += 36;
  });
  y += 254;
  y = addKeyValueCard(board, 28, y, "ベース候補", findFrameName(result, result.recommendation.primaryFrameId));
  y = addKeyValueCard(board, 28, y, "次点候補", result.recommendation.secondaryFrameId ? findFrameName(result, result.recommendation.secondaryFrameId) : "なし");
  y = addKeyValueCard(board, 28, y, "選定理由", result.recommendation.primaryReason);
  addListCard(board, 28, y, "background brief", [
    `背景の方向性: ${result.backgroundBrief.promptText}`,
    `避けること: ${result.backgroundBrief.avoid.join(", ")}`,
    `文字領域への配慮: ${result.backgroundBrief.safeAreaHint}`,
    `keywords: ${result.backgroundBrief.suggestedStyleKeywords.join(", ")}`,
  ]);
  return board;
}

export function renderFinishBoard(result?: BackgroundResult, comparison?: ComparisonResult): FrameNode {
  const board = createBoard("Finish Board", "選ばれた案だけを背景で仕上げ、最終案として確認します。");
  const brief = result?.brief ?? comparison?.backgroundBrief;
  if (!brief) {
    addEmpty(board, "まだ仕上げ結果がありません。比較から背景生成briefを送るとここに表示されます。");
    return board;
  }

  let y = 112;
  y = addKeyValueCard(board, 28, y, "対象案", brief.targetFrameName);
  y = addKeyValueCard(board, 28, y, "background brief", brief.promptText);
  y = addKeyValueCard(board, 28, y, "背景スタイル", `${brief.mood} / ${brief.style}`);
  y = addListCard(board, 28, y, "避けること", brief.avoid);
  const beforeAfter = createCard(28, y, 784, 190);
  board.appendChild(beforeAfter);
  addText(beforeAfter, "適用前", 28, 20, { size: 13, bold: true });
  addText(beforeAfter, "適用後", 426, 20, { size: 13, bold: true });
  addPreviewBox(beforeAfter, 28, 52, "背景適用前");
  addPreviewBox(beforeAfter, 426, 52, result ? `最終案 / ${result.styleName}` : "背景生成待ち");
  y += 206;
  if (result) addKeyValueCard(board, 28, y, "成功メッセージ", result.message ?? "背景レイヤーを適用できます。");
  return board;
}

function createBoard(title: string, description: string): FrameNode {
  const frame = createFrame(title, 0, 0, 860, 880, COLORS.board);
  frame.cornerRadius = 18;
  frame.strokes = [{ type: "SOLID", color: COLORS.border }];
  frame.strokeWeight = 1;
  addText(frame, title, 28, 28, { size: 24, bold: true, width: 760 });
  addText(frame, description, 28, 64, { size: 12, color: COLORS.muted, width: 760 });
  const line = figma.createRectangle();
  line.resize(804, 1);
  line.x = 28;
  line.y = 96;
  line.fills = [{ type: "SOLID", color: COLORS.border }];
  frame.appendChild(line);
  return frame;
}

function createFrame(name: string, x: number, y: number, width: number, height: number, fill: RGB): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.x = x;
  frame.y = y;
  frame.resize(width, height);
  frame.fills = [{ type: "SOLID", color: fill }];
  frame.clipsContent = false;
  return frame;
}

function createCard(x: number, y: number, width: number, height: number): FrameNode {
  const card = createFrame("Card", x, y, width, height, COLORS.card);
  card.cornerRadius = 12;
  card.strokes = [{ type: "SOLID", color: COLORS.border }];
  card.strokeWeight = 1;
  return card;
}

function addKeyValueCard(parent: FrameNode, x: number, y: number, label: string, value: string): number {
  const height = Math.max(74, Math.ceil(value.length / 60) * 20 + 48);
  const card = createCard(x, y, 784, height);
  parent.appendChild(card);
  addText(card, label, 18, 14, { size: 11, color: COLORS.blue, bold: true, width: 720 });
  addText(card, value || "未指定", 18, 34, { size: 13, width: 740, height: height - 44 });
  return y + height + 12;
}

function addListCard(parent: FrameNode, x: number, y: number, label: string, items: string[]): number {
  const visibleItems = items.length > 0 ? items.slice(0, 5) : ["項目はありません。"];
  const height = Math.max(88, visibleItems.length * 34 + 48);
  const card = createCard(x, y, 784, height);
  parent.appendChild(card);
  addText(card, label, 18, 14, { size: 13, bold: true, width: 720 });
  visibleItems.forEach((item, index) => addText(card, `- ${item}`, 18, 42 + index * 34, { size: 11, color: COLORS.muted, width: 740, height: 30 }));
  return y + height + 12;
}

function addEmpty(parent: FrameNode, message: string): void {
  const card = createCard(28, 132, 784, 180);
  parent.appendChild(card);
  addText(card, "まだ出力はありません", 28, 40, { size: 18, bold: true, width: 720 });
  addText(card, message, 28, 76, { size: 13, color: COLORS.muted, width: 700 });
}

function addPreviewBox(parent: FrameNode, x: number, y: number, label: string): void {
  const box = createFrame(label, x, y, 330, 110, COLORS.paleBlue);
  box.cornerRadius = 10;
  box.strokes = [{ type: "SOLID", color: COLORS.border }];
  box.strokeWeight = 1;
  parent.appendChild(box);
  addText(box, label, 20, 42, { size: 14, bold: true, color: COLORS.blue, width: 280 });
}

function addPill(parent: FrameNode, x: number, y: number, text: string, fill: RGB, width = 240): void {
  const pill = figma.createFrame();
  pill.name = `Pill / ${text}`;
  pill.x = x;
  pill.y = y;
  pill.resize(width, 28);
  pill.cornerRadius = 14;
  pill.fills = [{ type: "SOLID", color: fill }];
  parent.appendChild(pill);
  addText(pill, text, 12, 7, { size: 10, color: { r: 1, g: 1, b: 1 }, bold: true, width: width - 24, height: 14 });
}

function addText(parent: FrameNode, characters: string, x: number, y: number, options: TextOptions = {}): TextNode {
  const node = figma.createText();
  node.name = options.bold ? "Text / Bold" : "Text";
  node.fontName = options.bold ? FONT_BOLD : FONT_REGULAR;
  node.fontSize = options.size ?? 12;
  node.fills = [{ type: "SOLID", color: options.color ?? COLORS.text }];
  node.characters = characters;
  node.x = x;
  node.y = y;
  if (options.width) {
    node.resize(options.width, options.height ?? Math.max(20, node.height));
    node.textAutoResize = "HEIGHT";
  }
  parent.appendChild(node);
  return node;
}

async function loadFonts(): Promise<void> {
  await Promise.all([figma.loadFontAsync(FONT_REGULAR), figma.loadFontAsync(FONT_BOLD)]);
}

function findFrameName(result: ComparisonResult, frameId: string): string {
  return result.frames.find((frame) => frame.id === frameId)?.name ?? frameId;
}
