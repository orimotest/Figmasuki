import type { BackgroundResult } from "../../schemas/background";
import type { ComparisonResult } from "../../schemas/comparison";
import type { DiagnosisResult } from "../../schemas/diagnosis";
import type { Direction } from "../../schemas/direction";
import type { ProjectData } from "../../schemas/project";
import type { SvgCandidate } from "../../schemas/svg";

const COLORS = {
  canvas: { r: 0.969, g: 0.976, b: 0.988 },
  board: { r: 1, g: 1, b: 1 },
  card: { r: 0.984, g: 0.988, b: 0.996 },
  border: { r: 0.898, g: 0.918, b: 0.949 },
  text: { r: 0.067, g: 0.094, b: 0.153 },
  muted: { r: 0.294, g: 0.333, b: 0.388 },
  blue: { r: 0.145, g: 0.388, b: 0.922 },
  paleBlue: { r: 0.929, g: 0.961, b: 1 },
  green: { r: 0.086, g: 0.639, b: 0.29 },
  orange: { r: 0.961, g: 0.62, b: 0.043 },
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

type RenderOptions = {
  x?: number;
  y?: number;
  zoom?: boolean;
};

export async function renderProcessBoard(project: ProjectData, options: RenderOptions = {}): Promise<FrameNode> {
  await loadFonts();
  const root = createFrame(`AI Cover Studio / Process Board / ${project.projectName}`, 0, 0, 1840, 1720, COLORS.canvas);
  root.cornerRadius = 28;
  root.strokes = [{ type: "SOLID", color: COLORS.border }];
  root.strokeWeight = 1;
  root.x = options.x ?? figma.viewport.center.x - 920;
  root.y = options.y ?? figma.viewport.center.y - 760;

  renderHeader(root, project);
  renderCopySection(root, project.copyDirections);
  renderLayoutSection(root, project);
  renderCandidateSection(root, project.svgCandidates, project.copyDirections);
  renderInsightSection(root, project);

  figma.currentPage.appendChild(root);
  if (options.zoom !== false) {
    figma.currentPage.selection = [root];
    figma.viewport.scrollAndZoomIntoView([root]);
  }
  return root;
}

export async function renderStandaloneDiagnosisBoard(result: DiagnosisResult): Promise<FrameNode> {
  await loadFonts();
  const board = createStandaloneBoard("Diagnosis Board", "診断結果をFigma上に記録します。", 900, 900);
  renderDiagnosisContent(board, [result], 32, 120, 836);
  placeStandalone(board);
  return board;
}

export async function renderStandaloneCompareBoard(result: ComparisonResult): Promise<FrameNode> {
  await loadFonts();
  const board = createStandaloneBoard("Compare Board", "比較結果とbackground briefをFigma上に記録します。", 980, 1040);
  renderCompareContent(board, result, 32, 120, 916);
  placeStandalone(board);
  return board;
}

export async function renderStandaloneFinishBoard(result: BackgroundResult, comparison?: ComparisonResult): Promise<FrameNode> {
  await loadFonts();
  const board = createStandaloneBoard("Finish Board", "仕上げ結果をFigma上に記録します。", 900, 900);
  renderFinishContent(board, result, comparison, 32, 120, 836);
  placeStandalone(board);
  return board;
}

export function renderProjectBoard(project: ProjectData): FrameNode {
  const board = createStandaloneBoard("Project Header Board", "案件の前提条件をまとめたボードです。", 900, 900);
  renderHeader(board, project);
  return board;
}

export function renderCopyBoard(directions: Direction[], project?: ProjectData): FrameNode {
  const board = createStandaloneBoard("Copy Direction Board", "探索したコピー方向性をまとめたボードです。", 900, 900);
  addText(board, project?.projectName ?? "Copy Exploration", 32, 84, { size: 16, bold: true, color: COLORS.blue, width: 760 });
  renderCopyCards(board, directions, 32, 130, 836);
  return board;
}

export function renderLayoutBoard(project: ProjectData): FrameNode {
  const board = createStandaloneBoard("Layout Strategy Board", "レイアウト方針をまとめたボードです。", 900, 900);
  renderLayoutCards(board, project, 32, 120, 836);
  return board;
}

export function renderCandidateBoard(candidates: SvgCandidate[], directions: Direction[]): FrameNode {
  const board = createStandaloneBoard("SVG Candidate Board", "SVG候補をまとめたボードです。", 900, 900);
  renderCandidateGrid(board, candidates, directions, 32, 120, 836);
  return board;
}

export function renderDiagnosisBoard(results: DiagnosisResult[]): FrameNode {
  const board = createStandaloneBoard("Diagnosis Board", "診断結果をまとめたボードです。", 900, 900);
  renderDiagnosisContent(board, results, 32, 120, 836);
  return board;
}

export function renderCompareBoard(result?: ComparisonResult): FrameNode {
  const board = createStandaloneBoard("Compare Board", "比較結果をまとめたボードです。", 980, 1040);
  renderCompareContent(board, result, 32, 120, 916);
  return board;
}

export function renderFinishBoard(result?: BackgroundResult, comparison?: ComparisonResult): FrameNode {
  const board = createStandaloneBoard("Finish Board", "仕上げ結果をまとめたボードです。", 900, 900);
  renderFinishContent(board, result, comparison, 32, 120, 836);
  return board;
}

function renderHeader(parent: FrameNode, project: ProjectData): void {
  addText(parent, "AI Cover Studio / Process Board", 40, 34, { size: 30, bold: true, width: 900 });
  addText(parent, "AIが探索したコピー、レイアウト、SVG候補、診断・比較・仕上げ判断を1枚にまとめたレビュー用ボードです。", 40, 76, {
    size: 14,
    color: COLORS.muted,
    width: 1160,
  });
  addPill(parent, 1548, 42, project.providerMeta.mode.includes("Demo") ? "Demo Mode" : "Live / Mixed", COLORS.blue, 220);

  const info = createCard(40, 126, 1760, 148);
  parent.appendChild(info);
  addMetric(info, "プロジェクト名", project.projectName, 24, 22, 360);
  addMetric(info, "用途", project.contentType === "seminar_banner" ? "セミナー / ウェビナーバナー" : "note / ブログサムネイル", 420, 22, 300);
  addMetric(info, "サイズ", `${project.canvasSize.width} x ${project.canvasSize.height}`, 760, 22, 220);
  addMetric(info, "入力", project.inputMode === "fixed_copy" ? "確定コピーから作成" : "要件から作成", 1020, 22, 240);
  addMetric(info, "作成日時", new Date(project.createdAt).toLocaleString("ja-JP"), 1300, 22, 360);
  addMetric(info, "ターゲット", project.inputSummary.targetAudience ?? "未指定", 24, 88, 520);
  addMetric(info, "ゴール", project.inputSummary.goal ?? "未指定", 580, 88, 520);
  addMetric(info, "入力内容", project.inputSummary.brief, 1140, 88, 580);
}

function renderCopySection(parent: FrameNode, directions: Direction[]): void {
  const section = createSection("Copy Direction", "30案を探索して抽出した5つのコピー方向性", 40, 314, 560, 760);
  parent.appendChild(section);
  renderCopyCards(section, directions, 20, 78, 520);
}

function renderLayoutSection(parent: FrameNode, project: ProjectData): void {
  const section = createSection("Layout Strategy", "各方向性に対応する構図・優先順位・背景方針", 640, 314, 560, 760);
  parent.appendChild(section);
  renderLayoutCards(section, project, 20, 78, 520);
}

function renderCandidateSection(parent: FrameNode, candidates: SvgCandidate[], directions: Direction[]): void {
  const section = createSection("SVG Candidates", "生成された5案。上部の実物フレームと対応します。", 1240, 314, 560, 760);
  parent.appendChild(section);
  renderCandidateGrid(section, candidates, directions, 20, 78, 520);
}

function renderInsightSection(parent: FrameNode, project: ProjectData): void {
  const section = createSection("Review Notes", "診断・比較・仕上げの結果がある場合はここに追記されます。", 40, 1118, 1760, 548);
  parent.appendChild(section);
  renderDiagnosisContent(section, project.diagnosisResults, 24, 82, 520);
  renderCompareContent(section, project.comparisonResult, 620, 82, 520);
  renderFinishContent(section, project.backgroundResult, project.comparisonResult, 1216, 82, 520);
}

function renderCopyCards(parent: FrameNode, directions: Direction[], x: number, y: number, width: number): void {
  if (directions.length === 0) {
    addEmpty(parent, "コピー方向性はまだありません。", x, y, width);
    return;
  }
  directions.slice(0, 5).forEach((direction, index) => {
    const card = createCard(x, y + index * 126, width, 112);
    parent.appendChild(card);
    addText(card, `${index + 1}. ${direction.title}`, 16, 12, { size: 14, bold: true, width: width - 32 });
    addText(card, direction.copy.main.replace(/\n/g, " / "), 16, 34, { size: 12, bold: true, color: COLORS.blue, width: width - 32 });
    addText(card, direction.copy.sub, 16, 56, { size: 10, color: COLORS.muted, width: width - 32, height: 24 });
    addText(card, `意図: ${direction.intent}`, 16, 82, { size: 9, color: COLORS.muted, width: width - 32 });
    if (direction.copy.cta) addPill(card, width - 146, 12, direction.copy.cta, COLORS.green, 126);
  });
}

function renderLayoutCards(parent: FrameNode, project: ProjectData, x: number, y: number, width: number): void {
  if (project.layoutStrategies.length === 0) {
    addEmpty(parent, "レイアウト方針はまだありません。", x, y, width);
    return;
  }
  project.layoutStrategies.slice(0, 5).forEach((strategy, index) => {
    const card = createCard(x, y + index * 126, width, 112);
    parent.appendChild(card);
    addText(card, `${index + 1}. ${strategy.directionName}`, 16, 12, { size: 14, bold: true, width: 260 });
    addPill(card, width - 156, 10, strategy.layoutType, COLORS.blue, 136);
    addText(card, `構図: ${strategy.composition}`, 16, 38, { size: 10, width: width - 32, height: 30 });
    addText(card, `優先順位: ${strategy.hierarchy.join(" > ")}`, 16, 70, { size: 9, color: COLORS.muted, width: width - 32 });
    addText(card, `背景: ${strategy.background}`, 16, 90, { size: 9, color: COLORS.muted, width: width - 32 });
  });
}

function renderCandidateGrid(parent: FrameNode, candidates: SvgCandidate[], directions: Direction[], x: number, y: number, width: number): void {
  if (candidates.length === 0) {
    addEmpty(parent, "SVG候補はまだありません。", x, y, width);
    return;
  }
  const byDirection = new Map(directions.map((direction) => [direction.id, direction]));
  candidates.slice(0, 5).forEach((candidate, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const cardWidth = (width - 16) / 2;
    const card = createCard(x + col * (cardWidth + 16), y + row * 202, cardWidth, 188);
    parent.appendChild(card);
    const direction = byDirection.get(candidate.directionId);
    addText(card, direction?.title ?? candidate.name, 12, 10, { size: 12, bold: true, width: cardWidth - 24 });
    const svgNode = figma.createNodeFromSvg(candidate.svg);
    svgNode.name = candidate.name;
    svgNode.x = 12;
    svgNode.y = 34;
    svgNode.resize(cardWidth - 24, 112);
    card.appendChild(svgNode);
    addText(card, direction?.summary ?? candidate.name, 12, 154, { size: 8, color: COLORS.muted, width: cardWidth - 24, height: 24 });
  });
}

function renderDiagnosisContent(parent: FrameNode, results: DiagnosisResult[], x: number, y: number, width: number): void {
  const result = results[results.length - 1];
  const card = createCard(x, y, width, 420);
  parent.appendChild(card);
  addText(card, "Diagnosis", 16, 14, { size: 16, bold: true, color: COLORS.blue });
  if (!result) {
    addText(card, "診断結果はまだありません。1案を選択して診断するとここに記録されます。", 16, 48, { size: 11, color: COLORS.muted, width: width - 32 });
    return;
  }
  addText(card, `対象: ${result.frameName}`, 16, 46, { size: 11, bold: true, width: width - 32 });
  addText(card, result.summary, 16, 70, { size: 10, width: width - 32, height: 46 });
  addText(card, `最初に伝わること: ${result.firstImpression}`, 16, 124, { size: 9, color: COLORS.muted, width: width - 32, height: 48 });
  addList(card, "強い点", result.strengths, 16, 184, width - 32);
  addList(card, "気になる点", result.concerns, 16, 282, width - 32);
}

function renderCompareContent(parent: FrameNode, result: ComparisonResult | undefined, x: number, y: number, width: number): void {
  const card = createCard(x, y, width, 420);
  parent.appendChild(card);
  addText(card, "Compare", 16, 14, { size: 16, bold: true, color: COLORS.blue });
  if (!result) {
    addText(card, "比較結果はまだありません。2〜5案を選択して比較するとここに記録されます。", 16, 48, { size: 11, color: COLORS.muted, width: width - 32 });
    return;
  }
  addText(card, result.comparisonSummary, 16, 46, { size: 10, width: width - 32, height: 48 });
  addText(card, `ベース候補: ${findFrameName(result, result.recommendation.primaryFrameId)}`, 16, 104, { size: 11, bold: true, color: COLORS.green, width: width - 32 });
  addText(card, `次点候補: ${result.recommendation.secondaryFrameId ? findFrameName(result, result.recommendation.secondaryFrameId) : "なし"}`, 16, 128, {
    size: 10,
    color: COLORS.muted,
    width: width - 32,
  });
  addText(card, `選定理由: ${result.recommendation.primaryReason}`, 16, 154, { size: 9, color: COLORS.muted, width: width - 32, height: 46 });
  addList(
    card,
    "background brief",
    [
      result.backgroundBrief.promptText,
      `避けること: ${result.backgroundBrief.avoid.join(", ")}`,
      `文字領域: ${result.backgroundBrief.safeAreaHint}`,
    ],
    16,
    224,
    width - 32,
  );
}

function renderFinishContent(parent: FrameNode, result: BackgroundResult | undefined, comparison: ComparisonResult | undefined, x: number, y: number, width: number): void {
  const brief = result?.brief ?? comparison?.backgroundBrief;
  const card = createCard(x, y, width, 420);
  parent.appendChild(card);
  addText(card, "Finish", 16, 14, { size: 16, bold: true, color: COLORS.blue });
  if (!brief) {
    addText(card, "仕上げ結果はまだありません。比較から背景briefを作るとここに記録されます。", 16, 48, { size: 11, color: COLORS.muted, width: width - 32 });
    return;
  }
  addText(card, `対象: ${brief.targetFrameName}`, 16, 46, { size: 11, bold: true, width: width - 32 });
  addText(card, brief.promptText, 16, 72, { size: 10, width: width - 32, height: 58 });
  addText(card, `背景スタイル: ${brief.mood} / ${brief.style}`, 16, 140, { size: 9, color: COLORS.muted, width: width - 32 });
  addList(card, "避けること", brief.avoid, 16, 180, width - 32);
  addPreviewBox(card, 16, 306, result ? `最終案 / ${result.styleName}` : "背景生成後の確認欄", width - 32, 78);
}

function createStandaloneBoard(title: string, description: string, width: number, height: number): FrameNode {
  const board = createFrame(title, 0, 0, width, height, COLORS.board);
  board.cornerRadius = 18;
  board.strokes = [{ type: "SOLID", color: COLORS.border }];
  board.strokeWeight = 1;
  addText(board, title, 32, 30, { size: 24, bold: true, width: width - 64 });
  addText(board, description, 32, 66, { size: 12, color: COLORS.muted, width: width - 64 });
  return board;
}

function createSection(title: string, description: string, x: number, y: number, width: number, height: number): FrameNode {
  const section = createFrame(title, x, y, width, height, COLORS.board);
  section.cornerRadius = 18;
  section.strokes = [{ type: "SOLID", color: COLORS.border }];
  section.strokeWeight = 1;
  addText(section, title, 20, 18, { size: 20, bold: true, width: width - 40 });
  addText(section, description, 20, 48, { size: 11, color: COLORS.muted, width: width - 40 });
  return section;
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

function addMetric(parent: FrameNode, label: string, value: string, x: number, y: number, width: number): void {
  addText(parent, label, x, y, { size: 10, color: COLORS.blue, bold: true, width });
  addText(parent, value || "未指定", x, y + 18, { size: 12, width, height: 34 });
}

function addList(parent: FrameNode, title: string, items: string[], x: number, y: number, width: number): void {
  addText(parent, title, x, y, { size: 10, bold: true, color: COLORS.blue, width });
  const visible = items.length > 0 ? items.slice(0, 3) : ["項目はありません。"];
  visible.forEach((item, index) => addText(parent, `- ${item}`, x, y + 20 + index * 24, { size: 9, color: COLORS.muted, width, height: 22 }));
}

function addEmpty(parent: FrameNode, message: string, x: number, y: number, width: number): void {
  const card = createCard(x, y, width, 120);
  parent.appendChild(card);
  addText(card, "まだ出力はありません", 16, 22, { size: 15, bold: true, width: width - 32 });
  addText(card, message, 16, 52, { size: 11, color: COLORS.muted, width: width - 32 });
}

function addPreviewBox(parent: FrameNode, x: number, y: number, label: string, width = 300, height = 110): void {
  const box = createFrame(label, x, y, width, height, COLORS.paleBlue);
  box.cornerRadius = 10;
  box.strokes = [{ type: "SOLID", color: COLORS.border }];
  box.strokeWeight = 1;
  parent.appendChild(box);
  addText(box, label, 20, Math.max(22, height / 2 - 8), { size: 13, bold: true, color: COLORS.blue, width: width - 40 });
}

function addPill(parent: FrameNode, x: number, y: number, text: string, fill: RGB, width = 160, textColor: RGB = { r: 1, g: 1, b: 1 }): void {
  const pill = figma.createFrame();
  pill.name = `Pill / ${text}`;
  pill.x = x;
  pill.y = y;
  pill.resize(width, 28);
  pill.cornerRadius = 14;
  pill.fills = [{ type: "SOLID", color: fill }];
  parent.appendChild(pill);
  addText(pill, text, 12, 7, { size: 10, color: textColor, bold: true, width: width - 24, height: 14 });
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

function placeStandalone(board: FrameNode): void {
  board.x = figma.viewport.center.x - board.width / 2;
  board.y = figma.viewport.center.y - board.height / 2;
  figma.currentPage.appendChild(board);
  figma.currentPage.selection = [board];
  figma.viewport.scrollAndZoomIntoView([board]);
}

function findFrameName(result: ComparisonResult, frameId: string): string {
  return result.frames.find((frame) => frame.id === frameId)?.name ?? frameId;
}
