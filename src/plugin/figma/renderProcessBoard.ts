import type { BackgroundResult } from "../../schemas/background";
import type { ComparisonResult } from "../../schemas/comparison";
import type { DiagnosisResult } from "../../schemas/diagnosis";
import type { Direction } from "../../schemas/direction";
import { typographyDraftLayoutLabels } from "../../schemas/layoutDraft";
import type { ProjectData } from "../../schemas/project";
import type { ProcessBoardStage } from "../../schemas/production";
import type { SvgCandidate } from "../../schemas/svg";
import type { BackgroundVariation, DemoComparison, IdeaDirection, StageWorkflowData, TypographyDraft } from "../../schemas/workflow";

const COLORS = {
  canvas: { r: 0.969, g: 0.976, b: 0.988 },
  board: { r: 1, g: 1, b: 1 },
  card: { r: 0.984, g: 0.988, b: 0.996 },
  border: { r: 0.898, g: 0.918, b: 0.949 },
  text: { r: 0.067, g: 0.094, b: 0.153 },
  muted: { r: 0.294, g: 0.333, b: 0.388 },
  blue: { r: 0.122, g: 0.435, b: 0.357 },
  paleBlue: { r: 0.91, g: 0.957, b: 0.937 },
  green: { r: 0.137, g: 0.478, b: 0.294 },
  orange: { r: 0.678, g: 0.424, b: 0.153 },
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

const DEFAULT_LAYOUT_BASE = {
  xOffset: -3800,
  yOffset: -760,
};

export const PROCESS_STAGE_POSITIONS: Record<ProcessBoardStage, { x: number; y: number }> = {
  project_header: { x: 0, y: 0 },
  ideas: { x: 700, y: 0 },
  typography_drafts: { x: 1992, y: 0 },
  refined_svgs: { x: 3484, y: 0 },
  diagnosis: { x: 4916, y: 800 },
  compare: { x: 5416, y: 0 },
  background_variations: { x: 6388, y: 0 },
  final_candidate: { x: 7340, y: 0 },
};

export async function renderProcessBoard(project: ProjectData, options: RenderOptions = {}): Promise<FrameNode[]> {
  await loadFonts();
  const startX = options.x ?? figma.viewport.center.x + DEFAULT_LAYOUT_BASE.xOffset;
  const startY = options.y ?? figma.viewport.center.y + DEFAULT_LAYOUT_BASE.yOffset;
  const boards = [
    createProcessOverviewBoard(project, startX - 880, startY),
    renderProcessStageAt(project, "project_header", startX, startY),
    renderProcessStageAt(project, "ideas", startX, startY),
    renderProcessStageAt(project, "typography_drafts", startX, startY),
    renderProcessStageAt(project, "refined_svgs", startX, startY),
    ...(project.diagnosisResults.length > 0 ? [renderProcessStageAt(project, "diagnosis", startX, startY)] : []),
    renderProcessStageAt(project, "compare", startX, startY),
    renderProcessStageAt(project, "background_variations", startX, startY),
    renderProcessStageAt(project, "final_candidate", startX, startY),
  ];

  if (options.zoom !== false) {
    figma.currentPage.selection = boards;
    figma.viewport.scrollAndZoomIntoView(boards);
  }
  return boards;
}

export async function renderProcessOverviewBoard(project: ProjectData, options: RenderOptions = {}): Promise<FrameNode> {
  await loadFonts();
  const defaultPosition = getDefaultStagePosition("project_header");
  const board = createProcessOverviewBoard(project, options.x ?? defaultPosition.x - 880, options.y ?? defaultPosition.y);
  if (options.zoom !== false) {
    figma.currentPage.selection = [board];
    figma.viewport.scrollAndZoomIntoView([board]);
  }
  return board;
}

export async function renderProcessStageBoard(project: ProjectData, stage: ProcessBoardStage, options: RenderOptions = {}): Promise<FrameNode> {
  await loadFonts();
  const defaultPosition = getDefaultStagePosition(stage);
  const startX = options.x ?? defaultPosition.x;
  const startY = options.y ?? defaultPosition.y;
  const board = renderProcessStage(project, stage, startX, startY);
  if (options.zoom !== false) {
    figma.currentPage.selection = [board];
    figma.viewport.scrollAndZoomIntoView([board]);
  }
  return board;
}

function renderProcessStageAt(project: ProjectData, stage: ProcessBoardStage, baseX: number, baseY: number): FrameNode {
  const position = PROCESS_STAGE_POSITIONS[stage];
  return renderProcessStage(project, stage, baseX + position.x, baseY + position.y);
}

function getDefaultStagePosition(stage: ProcessBoardStage): { x: number; y: number } {
  const baseX = figma.viewport.center.x + DEFAULT_LAYOUT_BASE.xOffset;
  const baseY = figma.viewport.center.y + DEFAULT_LAYOUT_BASE.yOffset;
  const position = PROCESS_STAGE_POSITIONS[stage];
  return { x: baseX + position.x, y: baseY + position.y };
}

function renderProcessStage(project: ProjectData, stage: ProcessBoardStage, x: number, y: number): FrameNode {
  const workflow = project.stageWorkflow;
  switch (stage) {
    case "project_header":
      return renderProjectHeaderBoard(null, project, x, y);
    case "ideas":
      return renderIdeaExploreBoard(null, workflow?.ideaDirections ?? [], x, y);
    case "typography_drafts":
      return renderTypographyDraftBoard(null, workflow?.typographyDrafts ?? [], x, y);
    case "refined_svgs":
      return renderRefinedSvgBoard(null, workflow, project.svgCandidates, x, y);
    case "diagnosis":
      return renderDiagnosisBoardPanel(null, project.diagnosisResults, x, y);
    case "compare":
      return renderCompareBoardPanel(null, project.comparisonResult, workflow?.demoComparison, x, y);
    case "background_variations":
      return renderBackgroundVariationsBoard(null, workflow?.backgroundVariations ?? [], project.backgroundResult, x, y);
    case "final_candidate":
      return renderFinalCandidateBoard(null, project, x, y);
  }
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
  renderProjectHeaderContent(board, project, 32, 120, 836);
  return board;
}

export function renderCopyBoard(directions: Direction[], project?: ProjectData): FrameNode {
  const board = createStandaloneBoard("30 Ideas Explore Board", "探索したコピー方向性をまとめたボードです。", 1080, 900);
  renderIdeaGrid(board, project?.stageWorkflow?.ideaDirections ?? createIdeaFallback(directions), 32, 120, 1016);
  return board;
}

export function renderLayoutBoard(project: ProjectData): FrameNode {
  const board = createStandaloneBoard("15 Typography Draft Board", "文字組みドラフトをまとめたボードです。", 1440, 1080);
  renderDraftGrid(board, project.stageWorkflow?.typographyDrafts ?? [], 32, 120, 1376);
  return board;
}

export function renderCandidateBoard(candidates: SvgCandidate[], directions: Direction[]): FrameNode {
  const board = createStandaloneBoard("5 Refined SVG Board", "高品質SVG 5案をまとめた単体ボードです。", 1280, 1080);
  renderRefinedGrid(board, undefined, candidates, directions, 32, 120, 1216);
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

function createProcessOverviewBoard(project: ProjectData, x: number, y: number): FrameNode {
  const board = createAutoFrame("00 Production Timeline", x, y, 820, COLORS.board);
  board.cornerRadius = 18;
  board.strokes = [{ type: "SOLID", color: COLORS.border }];
  board.strokeWeight = 1;
  board.paddingTop = 28;
  board.paddingRight = 28;
  board.paddingBottom = 28;
  board.paddingLeft = 28;
  board.itemSpacing = 16;
  board.appendChild(createAutoText("00 Production Timeline", 24, true, 764, COLORS.text));
  board.appendChild(
    createAutoText("要件整理からFinal Candidateまで、AIが何を生成し、どこを人が判断するかを追える工程概要です。", 12, false, 764, COLORS.muted),
  );
  board.appendChild(createOverviewMetaRow(project));

  const steps = getOverviewSteps(project);
  const list = createAutoFrame("Production Steps", 0, 0, 764, COLORS.board);
  list.fills = [];
  list.itemSpacing = 8;
  steps.forEach((step) => list.appendChild(createOverviewStep(step)));
  board.appendChild(list);

  figma.currentPage.appendChild(board);
  return board;
}

function createOverviewMetaRow(project: ProjectData): FrameNode {
  const row = createAutoFrame("Project Summary", 0, 0, 764, COLORS.paleBlue, "HORIZONTAL");
  row.counterAxisSizingMode = "AUTO";
  row.paddingTop = 12;
  row.paddingRight = 12;
  row.paddingBottom = 12;
  row.paddingLeft = 12;
  row.itemSpacing = 10;
  row.cornerRadius = 12;
  row.strokes = [{ type: "SOLID", color: COLORS.border }];
  row.strokeWeight = 1;
  [
    ["Project", project.projectName],
    ["Mode", project.providerMeta.mode],
    ["Canvas", `${project.canvasSize.width} x ${project.canvasSize.height}`],
    ["Figma", `${project.figmaOutputs?.filter((output) => output.status === "placed").length ?? 0} recorded`],
  ].forEach(([label, value]) => row.appendChild(createAutoMetric(label, value)));
  return row;
}

function createOverviewStep(step: { no: string; title: string; detail: string; done: boolean }): FrameNode {
  const row = createAutoFrame(`Step ${step.no} / ${step.title}`, 0, 0, 764, step.done ? COLORS.paleBlue : COLORS.card, "HORIZONTAL");
  row.counterAxisSizingMode = "AUTO";
  row.paddingTop = 12;
  row.paddingRight = 14;
  row.paddingBottom = 12;
  row.paddingLeft = 14;
  row.itemSpacing = 12;
  row.cornerRadius = 10;
  row.strokes = [{ type: "SOLID", color: step.done ? COLORS.blue : COLORS.border }];
  row.strokeWeight = step.done ? 1.4 : 1;

  const badge = createAutoFrame(`Status / ${step.done ? "Done" : "Pending"}`, 0, 0, 70, step.done ? COLORS.blue : COLORS.board);
  badge.counterAxisSizingMode = "FIXED";
  badge.paddingTop = 8;
  badge.paddingRight = 8;
  badge.paddingBottom = 8;
  badge.paddingLeft = 8;
  badge.cornerRadius = 8;
  badge.strokes = [{ type: "SOLID", color: step.done ? COLORS.blue : COLORS.border }];
  badge.strokeWeight = 1;
  badge.appendChild(createAutoText(step.no, 11, true, 54, step.done ? COLORS.board : COLORS.blue));
  badge.appendChild(createAutoText(step.done ? "完了" : "待機", 8, true, 54, step.done ? COLORS.board : COLORS.muted));
  row.appendChild(badge);

  const copy = createAutoFrame("Step Copy", 0, 0, 654, COLORS.card);
  copy.fills = [];
  copy.itemSpacing = 4;
  copy.appendChild(createAutoText(step.title, 13, true, 654, COLORS.text));
  copy.appendChild(createAutoText(step.detail, 10, false, 654, COLORS.muted));
  row.appendChild(copy);
  return row;
}

function createAutoMetric(label: string, value: string): FrameNode {
  const metric = createAutoFrame(`Metric / ${label}`, 0, 0, 176, COLORS.board);
  metric.paddingTop = 10;
  metric.paddingRight = 10;
  metric.paddingBottom = 10;
  metric.paddingLeft = 10;
  metric.itemSpacing = 4;
  metric.cornerRadius = 8;
  metric.appendChild(createAutoText(label, 9, true, 156, COLORS.blue));
  metric.appendChild(createAutoText(value || "未指定", 10, false, 156, COLORS.text));
  return metric;
}

function getOverviewSteps(project: ProjectData): Array<{ no: string; title: string; detail: string; done: boolean }> {
  const workflow = project.stageWorkflow;
  const ideas = workflow?.ideaDirections.length ?? project.copyDirections.length;
  const drafts = workflow?.typographyDrafts.length ?? project.layoutStrategies.length;
  const refined = workflow?.refinedSvgCandidates.length ?? project.svgCandidates.length;
  const backgrounds = workflow?.backgroundVariations.length ?? (project.backgroundResult ? 1 : 0);
  const finals = workflow?.finalCandidates?.length ?? (workflow?.finalCandidate ? 1 : 0);
  return [
    {
      no: "01",
      title: "要件整理",
      detail: trimForBoard(project.inputSummary.brief || project.inputSummary.rawInput || "入力要件を整理して制作前提を残します。", 90),
      done: Boolean(project.inputSummary.brief || project.inputSummary.rawInput),
    },
    { no: "02", title: "30案探索", detail: `${ideas}案を役割別に見比べ、文字組みに進める方向を残します。`, done: ideas > 0 },
    { no: "03", title: "15案文字組みドラフト", detail: `${drafts}案の階層、余白、CTA位置を比較します。`, done: drafts > 0 },
    { no: "04", title: "5案高品質SVG", detail: `${refined}案をFigma上で編集できるSVG候補として整理します。`, done: refined > 0 },
    { no: "05", title: "比較・評価", detail: "Primary / Secondaryと、背景生成へ進む理由を記録します。", done: Boolean(project.comparisonResult || workflow?.demoComparison) },
    { no: "06", title: "背景3案生成", detail: `${backgrounds}案の背景方向を比較し、写真や質感の違いを残します。`, done: backgrounds > 0 },
    { no: "07", title: "Final Candidate", detail: `${finals}案の最終候補を、背景ごとの個性が見える形で確認します。`, done: finals > 0 },
    { no: "08", title: "Figma出力完了", detail: "工程ボード、候補フレーム、最終候補をキャンバス上でレビューします。", done: (project.figmaOutputs?.length ?? 0) > 0 },
  ];
}

function renderProjectHeaderBoard(parent: FrameNode | null, project: ProjectData, x: number, y: number): FrameNode {
  const board = createSection("01 Project Header", "案件前提、入力内容、実行モードを後から追えるようにまとめます。", x, y, 620, 720);
  appendBoard(parent, board);
  renderProjectHeaderContent(board, project, 24, 92, 572);
  return board;
}

function renderProjectHeaderContent(parent: FrameNode, project: ProjectData, x: number, y: number, width: number): void {
  const summary = createCard(x, y, width, 312);
  parent.appendChild(summary);
  addMetric(summary, "プロジェクト名", project.projectName, 20, 20, width - 40);
  addMetric(summary, "用途", project.contentType === "seminar_banner" ? "セミナー / ウェビナーバナー" : "note / ブログサムネイル", 20, 80, width - 40);
  addMetric(summary, "サイズ", `${project.canvasSize.width} x ${project.canvasSize.height}`, 20, 140, 180);
  addMetric(summary, "入力タイプ", project.inputMode === "fixed_copy" ? "確定コピーから作る" : "要件から作る", 230, 140, 220);
  addMetric(summary, "実行モード", project.providerMeta.mode, 20, 200, width - 40);
  addMetric(summary, "作成日時", new Date(project.createdAt).toLocaleString("ja-JP"), 20, 260, width - 40);

  const brief = createCard(x, y + 336, width, 238);
  parent.appendChild(brief);
  addText(brief, "入力要件", 18, 18, { size: 14, bold: true, color: COLORS.blue });
  addText(brief, project.inputSummary.brief, 18, 48, { size: 13, width: width - 36, height: 64 });
  addText(brief, "ターゲット", 18, 128, { size: 10, bold: true, color: COLORS.blue });
  addText(brief, project.inputSummary.targetAudience ?? "未指定", 18, 148, { size: 12, width: width - 36 });
  addText(brief, "ゴール", 18, 182, { size: 10, bold: true, color: COLORS.blue });
  addText(brief, project.inputSummary.goal ?? "未指定", 18, 202, { size: 12, width: width - 36 });
}

function renderIdeaExploreBoard(parent: FrameNode | null, ideas: IdeaDirection[], x: number, y: number): FrameNode {
  const board = createSection("02 30 Ideas Explore", "30案を5つの訴求方向に分け、なぜ残すか・落とすかを確認します。", x, y, 1220, 900);
  appendBoard(parent, board);
  addStageStats(board, [
    ["探索", "30案"],
    ["文字組みへ", `${ideas.filter((idea) => idea.status === "selected_for_typography").length}案`],
  ]);
  renderIdeaGrid(board, ideas, 24, 142, 1172);
  return board;
}

function renderTypographyDraftBoard(parent: FrameNode | null, drafts: TypographyDraft[], x: number, y: number): FrameNode {
  const board = createSection("03 15 Typography Drafts", "完成案の前に、文字階層・余白・CTA位置を軽量SVGで検討します。", x, y, 1420, 1060);
  appendBoard(parent, board);
  addStageStats(board, [
    ["ドラフト", "15案"],
    ["高品質SVGへ", `${drafts.filter((draft) => draft.selectedForRefine).length}案`],
    ["目的", "文字組み確認"],
  ]);
  renderDraftGrid(board, drafts, 24, 142, 1372);
  return board;
}

function renderRefinedSvgBoard(parent: FrameNode | null, workflow: StageWorkflowData | undefined, candidates: SvgCandidate[], x: number, y: number): FrameNode {
  const board = createSection("04 5 Refined SVGs", "比較しやすい5案に絞り、強みと懸念を添えてレビューできる形にします。", x, y, 1360, 1060);
  appendBoard(parent, board);
  addStageStats(board, [
    ["高品質SVG", "5案"],
    ["比較軸", "方向性差"],
    ["編集", "SVG text"],
  ]);
  renderRefinedGrid(board, workflow, candidates, [], 24, 142, 1312);
  return board;
}

function renderDiagnosisBoardPanel(parent: FrameNode | null, results: DiagnosisResult[], x: number, y: number): FrameNode {
  const board = createSection("05 Diagnosis", "1案を選択して、強み・懸念・最初に直す点を記録。", x, y, 760, 720);
  appendBoard(parent, board);
  renderDiagnosisContent(board, results, 24, 104, 712);
  return board;
}

function renderCompareBoardPanel(parent: FrameNode | null, result: ComparisonResult | undefined, demoComparison: DemoComparison | undefined, x: number, y: number): FrameNode {
  const board = createSection("05 Compare Result", "5案の役割と用途を比較し、Primary / Secondaryと背景方針を決めます。", x, y, 900, 720);
  appendBoard(parent, board);
  renderCompareContent(board, result, 24, 104, 852, demoComparison);
  return board;
}

function renderBackgroundVariationsBoard(
  parent: FrameNode | null,
  variations: BackgroundVariation[],
  result: BackgroundResult | undefined,
  x: number,
  y: number,
): FrameNode {
  const board = createSection("06 Background Variations", "Primary案に背景3案を当て、文字とCTAは編集可能なまま残します。", x, y, 880, 720);
  appendBoard(parent, board);
  addText(board, result?.brief.promptText ?? "比較後にbackground briefが入ります。代替処理では背景3案の方向性を確認できます。", 24, 88, {
    size: 11,
    color: COLORS.muted,
    width: 820,
    height: 36,
  });
  renderBackgroundGrid(board, variations, 24, 146, 832);
  return board;
}

function renderFinalCandidateBoard(parent: FrameNode | null, project: ProjectData, x: number, y: number): FrameNode {
  const board = createSection("07 Final Candidate", "選んだ案、適用背景、人間が次に調整するポイント。", x, y, 760, 720);
  appendBoard(parent, board);
  const final = project.stageWorkflow?.finalCandidate;
  const finals = project.stageWorkflow?.finalCandidates ?? [];
  if (finals.length > 1) {
    board.resize(980, 720);
    addText(board, "3つの背景を、それぞれ別の完成候補として確認します。写真・背景の個性を残し、文字組みは用途に合わせて選びます。", 24, 84, {
      size: 11,
      color: COLORS.muted,
      width: 920,
      height: 34,
    });
    finals.slice(0, 3).forEach((item, index) => {
      const card = createCard(24 + index * 312, 138, 292, 482);
      board.appendChild(card);
      addText(card, `${item.variantLabel ?? String.fromCharCode(65 + index)} / ${item.name}`, 16, 16, { size: 14, bold: true, color: COLORS.blue, width: 260 });
      addText(card, item.reason, 16, 48, { size: 9, width: 260, height: 74 });
      addList(card, "個性を出す判断", item.compositionNotes ?? [], 16, 144, 260);
      addList(card, "次に詰める点", item.nextAdjustments, 16, 278, 260);
      addPreviewBox(card, 16, 408, `Final ${item.variantLabel ?? index + 1}`, 260, 48);
    });
    return board;
  }
  const card = createCard(24, 104, 712, 516);
  board.appendChild(card);
  if (!final) {
    addText(card, "最終案はまだありません。比較と背景仕上げの後に記録されます。", 20, 24, { size: 13, color: COLORS.muted, width: 660 });
    return board;
  }
  addText(card, final.name, 20, 22, { size: 20, bold: true, color: COLORS.blue, width: 660 });
  addText(card, `採用理由: ${final.reason}`, 20, 62, { size: 12, width: 660, height: 70 });
  addList(card, "編集可能なレイヤー", final.editableLayers, 20, 156, 660);
  addList(card, "人間が次に調整するポイント", final.nextAdjustments, 20, 282, 660);
  addPreviewBox(card, 20, 416, "最終案は上部の実物フレームで確認", 660, 68);
  return board;
}

function renderIdeaGrid(parent: FrameNode, ideas: IdeaDirection[], x: number, y: number, width: number): void {
  if (ideas.length === 0) {
    addEmpty(parent, "30案探索はまだありません。サンプルフローを読み込むと表示されます。", x, y, width);
    return;
  }
  const groups = chunk(ideas.slice(0, 30), 6);
  const groupWidth = (width - 24) / 2;
  groups.slice(0, 5).forEach((group, groupIndex) => {
    const col = groupIndex % 2;
    const rowIndex = Math.floor(groupIndex / 2);
    const groupFrame = createCard(x + col * (groupWidth + 24), y + rowIndex * 238, groupWidth, 218);
    parent.appendChild(groupFrame);
    addText(groupFrame, getIdeaGroupTitle(groupIndex), 16, 14, { size: 14, bold: true, color: COLORS.blue, width: groupWidth - 32 });
    addText(groupFrame, getIdeaGroupDescription(groupIndex), 16, 40, { size: 9, color: COLORS.muted, width: groupWidth - 32 });

    group.forEach((idea, ideaIndex) => {
      const itemCol = ideaIndex % 2;
      const itemRow = Math.floor(ideaIndex / 2);
      const itemWidth = (groupWidth - 42) / 2;
      const isSelected = idea.status === "selected_for_typography";
      const row = createFrame(
        `Idea / ${idea.name}`,
        16 + itemCol * (itemWidth + 10),
        68 + itemRow * 46,
        itemWidth,
        38,
        isSelected ? COLORS.paleBlue : COLORS.board,
      );
      row.cornerRadius = 8;
      row.strokes = [{ type: "SOLID", color: isSelected ? COLORS.blue : COLORS.border }];
      row.strokeWeight = isSelected ? 1.5 : 1;
      groupFrame.appendChild(row);
      addText(row, `${String(groupIndex * 6 + ideaIndex + 1).padStart(2, "0")} ${idea.name}`, 8, 7, {
        size: 8,
        bold: true,
        color: isSelected ? COLORS.blue : COLORS.text,
        width: itemWidth - 16,
      });
      addText(row, idea.mainCopy.replace(/\n/g, " / "), 8, 22, { size: 7, bold: true, width: itemWidth - 16, height: 12 });
    });
  });
}

function getIdeaGroupTitle(index: number): string {
  return ["課題共感", "参加メリット", "実務ノウハウ", "信頼感", "初心者歓迎"][index] ?? `方向 ${index + 1}`;
}

function getIdeaGroupDescription(index: number): string {
  return [
    "不安や迷いに寄り添い、最初の一歩を見せる方向です。",
    "参加後に得られる価値を先に伝え、申し込み判断を助けます。",
    "現場で使える具体性を前面に出し、実務者に届きやすくします。",
    "BtoB向けに落ち着きと信頼感を優先して整理します。",
    "専門知識なしでも参加しやすい安心感を作ります。",
  ][index] ?? "探索したコピー方向性です。";
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

function renderDraftGrid(parent: FrameNode, drafts: TypographyDraft[], x: number, y: number, width: number): void {
  if (drafts.length === 0) {
    addEmpty(parent, "15案のTypography Draftはまだありません。サンプルフローを読み込むと表示されます。", x, y, width);
    return;
  }
  const cardWidth = (width - 48) / 5;
  drafts.slice(0, 15).forEach((draft, index) => {
    const col = index % 5;
    const row = Math.floor(index / 5);
    const card = createCard(x + col * (cardWidth + 12), y + row * 262, cardWidth, 242);
    if (draft.selectedForRefine) {
      card.strokes = [{ type: "SOLID", color: COLORS.blue }];
      card.strokeWeight = 1.5;
    }
    parent.appendChild(card);
    addText(card, `${draft.name} / ${typographyDraftLayoutLabels[draft.layoutType]}`, 12, 10, {
      size: 10,
      bold: true,
      color: draft.selectedForRefine ? COLORS.green : COLORS.blue,
      width: cardWidth - 24,
    });
    addText(card, draft.directionName, 12, 30, { size: 8, color: COLORS.muted, width: cardWidth - 24 });
    appendSvg(card, draft.svg, 12, 54, cardWidth - 24, 138, draft.name);
    addText(card, draft.evaluationMemo, 12, 204, { size: 8, color: COLORS.muted, width: cardWidth - 24, height: 28 });
  });
}

function renderRefinedGrid(parent: FrameNode, workflow: StageWorkflowData | undefined, candidates: SvgCandidate[], directions: Direction[], x: number, y: number, width: number): void {
  if (candidates.length === 0) {
    addEmpty(parent, "5案の高品質SVGはまだありません。サンプルフローを読み込むと表示されます。", x, y, width);
    return;
  }
  const byDirection = new Map(directions.map((direction) => [direction.id, direction]));
  const refined = workflow?.refinedSvgCandidates ?? candidates;
  refined.slice(0, 5).forEach((candidate, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const cardWidth = (width - 20) / 2;
    const card = createCard(x + col * (cardWidth + 20), y + row * 286, cardWidth, 266);
    parent.appendChild(card);
    const direction = byDirection.get(candidate.directionId);
    addText(card, `${index + 1}. ${direction?.title ?? candidate.name}`, 14, 12, { size: 13, bold: true, color: COLORS.blue, width: cardWidth - 28 });
    appendSvg(card, candidate.svg, 14, 40, 300, 170, candidate.name);
    addText(card, workflow?.refinedSvgCandidates[index]?.strength ?? direction?.summary ?? "方向性の違いを比較できる案です。", 330, 54, {
      size: 10,
      width: cardWidth - 350,
      height: 48,
    });
    addText(card, workflow?.refinedSvgCandidates[index]?.concern ?? direction?.riskNote ?? "仕上げ時に可読性を確認します。", 330, 120, {
      size: 9,
      color: COLORS.muted,
      width: cardWidth - 350,
      height: 52,
    });
    addPill(card, 330, 194, candidate.meta.layoutType, COLORS.blue, 152);
  });
}

function renderBackgroundGrid(parent: FrameNode, variations: BackgroundVariation[], x: number, y: number, width: number): void {
  if (variations.length === 0) {
    addEmpty(parent, "背景3案はまだありません。比較でPrimary案を選ぶと生成方針が入ります。", x, y, width);
    return;
  }
  const cardWidth = (width - 32) / 3;
  variations.slice(0, 3).forEach((variation, index) => {
    const card = createCard(x + index * (cardWidth + 16), y, cardWidth, 360);
    parent.appendChild(card);
    addText(card, variation.name, 12, 12, { size: 12, bold: true, color: variation.selected ? COLORS.green : COLORS.blue, width: cardWidth - 24 });
    if (variation.imageDataUrl) {
      appendImage(card, variation.imageDataUrl, 12, 42, cardWidth - 24, 148, variation.name);
    } else {
      appendSvg(card, variation.svg, 12, 42, cardWidth - 24, 148, variation.name);
    }
    addText(card, variation.direction, 12, 212, { size: 9, color: COLORS.muted, width: cardWidth - 24, height: 60 });
    addPill(card, 12, 306, variation.selected ? "選択中" : `背景案 ${String.fromCharCode(65 + index)}`, variation.selected ? COLORS.green : COLORS.muted, 90);
  });
}

function renderDiagnosisContent(parent: FrameNode, results: DiagnosisResult[], x: number, y: number, width: number): void {
  const result = results[results.length - 1];
  const card = createCard(x, y, width, 500);
  parent.appendChild(card);
  addText(card, "診断結果", 16, 14, { size: 16, bold: true, color: COLORS.blue });
  if (!result) {
    addText(card, "診断結果はまだありません。Figma上で1案を選択して診断すると、ここに記録されます。", 16, 48, {
      size: 11,
      color: COLORS.muted,
      width: width - 32,
    });
    return;
  }
  addText(card, `対象: ${result.frameName}`, 16, 46, { size: 11, bold: true, width: width - 32 });
  addText(card, result.summary, 16, 70, { size: 10, width: width - 32, height: 46 });
  addText(card, `最初に伝わること: ${result.firstImpression}`, 16, 124, { size: 9, color: COLORS.muted, width: width - 32, height: 48 });
  addList(card, "強い点", result.strengths, 16, 194, width - 32);
  addList(card, "気になる点", result.concerns, 16, 308, width - 32);
}

function renderCompareContent(parent: FrameNode, result: ComparisonResult | undefined, x: number, y: number, width: number, demoComparison?: DemoComparison): void {
  const card = createCard(x, y, width, 500);
  parent.appendChild(card);
  addText(card, "比較・評価", 16, 14, { size: 16, bold: true, color: COLORS.blue });
  if (!result) {
    if (demoComparison) {
      addText(card, demoComparison.summary, 16, 46, { size: 10, width: width - 32, height: 54 });
      addText(card, `Primary: ${demoComparison.primaryName}`, 16, 112, { size: 12, bold: true, color: COLORS.green, width: width - 32 });
      addText(card, `Secondary: ${demoComparison.secondaryName}`, 16, 138, { size: 10, color: COLORS.muted, width: width - 32 });
      addText(card, `選定理由: ${demoComparison.selectionReason}`, 16, 166, { size: 9, color: COLORS.muted, width: width - 32, height: 42 });
      demoComparison.rows.slice(0, 5).forEach((row, index) => {
        const yPos = 236 + index * 48;
        addText(card, row.name, 16, yPos, { size: 9, bold: true, color: COLORS.blue, width: 120 });
        addText(card, row.role, 146, yPos, { size: 8, width: 92 });
        addText(card, row.layout, 250, yPos, { size: 8, color: COLORS.muted, width: 132 });
        addText(card, row.strength, 398, yPos, { size: 8, color: COLORS.muted, width: width - 414, height: 30 });
      });
      return;
    }
    addText(card, "比較結果はまだありません。2から5案を選択して比較すると、ここに記録されます。", 16, 48, {
      size: 11,
      color: COLORS.muted,
      width: width - 32,
    });
    return;
  }
  addText(card, result.comparisonSummary, 16, 46, { size: 10, width: width - 32, height: 46 });
  addText(card, `Primary: ${findFrameName(result, result.recommendation.primaryFrameId)}`, 16, 106, {
    size: 12,
    bold: true,
    color: COLORS.green,
    width: width - 32,
  });
  addText(card, `Secondary: ${result.recommendation.secondaryFrameId ? findFrameName(result, result.recommendation.secondaryFrameId) : "なし"}`, 16, 132, {
    size: 10,
    color: COLORS.muted,
    width: width - 32,
  });
  addText(card, `選定理由: ${result.recommendation.primaryReason}`, 16, 162, { size: 9, color: COLORS.muted, width: width - 32, height: 46 });
  result.frameRoles.slice(0, 4).forEach((role, index) => {
    const yPos = 238 + index * 54;
    addText(card, role.frameName, 16, yPos, { size: 9, bold: true, color: COLORS.blue, width: 156 });
    addText(card, role.role, 184, yPos, { size: 8, width: 132 });
    addText(card, role.strength, 330, yPos, { size: 8, color: COLORS.muted, width: width - 350, height: 32 });
  });
}

function renderFinishContent(parent: FrameNode, result: BackgroundResult | undefined, comparison: ComparisonResult | undefined, x: number, y: number, width: number): void {
  const brief = result?.brief ?? comparison?.backgroundBrief;
  const card = createCard(x, y, width, 420);
  parent.appendChild(card);
  addText(card, "仕上げ", 16, 14, { size: 16, bold: true, color: COLORS.blue });
  if (!brief) {
    addText(card, "仕上げ結果はまだありません。比較からbackground briefを作ると、ここに記録されます。", 16, 48, {
      size: 11,
      color: COLORS.muted,
      width: width - 32,
    });
    return;
  }
  addText(card, `対象: ${brief.targetFrameName}`, 16, 46, { size: 11, bold: true, width: width - 32 });
  addText(card, brief.promptText, 16, 72, { size: 10, width: width - 32, height: 58 });
  addText(card, `背景スタイル: ${brief.mood} / ${brief.style}`, 16, 140, { size: 9, color: COLORS.muted, width: width - 32 });
  addList(card, "避けること", brief.avoid, 16, 180, width - 32);
  addPreviewBox(card, 16, 306, result ? `最終案 / ${result.styleName}` : "背景生成後に確認", width - 32, 78);
}

function addStageStats(parent: FrameNode, stats: Array<[string, string]>): void {
  stats.forEach(([label, value], index) => {
    const card = createFrame(`Stat / ${label}`, 24 + index * 154, 82, 138, 44, COLORS.paleBlue);
    card.cornerRadius = 12;
    card.strokes = [{ type: "SOLID", color: COLORS.border }];
    card.strokeWeight = 1;
    parent.appendChild(card);
    addText(card, label, 12, 8, { size: 8, bold: true, color: COLORS.blue, width: 114 });
    addText(card, value, 12, 22, { size: 11, bold: true, width: 114 });
  });
}

function createIdeaFallback(directions: Direction[]): IdeaDirection[] {
  return directions.flatMap((direction, directionIndex) =>
    Array.from({ length: 6 }, (_, index) => ({
      id: `idea_${direction.id}_${index + 1}`,
      name: `${direction.title} ${index + 1}`,
      mainCopy: direction.copy.main,
      subCopy: direction.copy.sub,
      cta: direction.copy.cta,
      intent: direction.intent,
      tone: direction.tone.join(" / "),
      layoutHint: direction.layoutBrief.composition,
      risk: direction.riskNote ?? "比較時に確認します。",
      bestFor: direction.tags?.join(" / ") ?? "検討案",
      status: index < 3 && directionIndex < 5 ? "selected_for_typography" : "rejected",
      selectionReason: "代替処理",
    })),
  );
}

function appendSvg(parent: FrameNode, svg: string, x: number, y: number, width: number, height: number, name: string): void {
  const preview = createFrame(`Preview / ${name}`, x, y, width, height, COLORS.board);
  preview.cornerRadius = 8;
  preview.strokes = [{ type: "SOLID", color: COLORS.border }];
  preview.strokeWeight = 1;
  preview.clipsContent = true;
  parent.appendChild(preview);

  const svgNode = figma.createNodeFromSvg(svg);
  svgNode.name = name;
  const originalWidth = Math.max(svgNode.width, 1);
  const originalHeight = Math.max(svgNode.height, 1);
  const scale = Math.min(width / originalWidth, height / originalHeight);
  const scalableNode = svgNode as SceneNode & { rescale?: (scale: number) => void };

  if (typeof scalableNode.rescale === "function") {
    scalableNode.rescale(scale);
  } else {
    svgNode.resize(originalWidth * scale, originalHeight * scale);
  }

  svgNode.x = (width - svgNode.width) / 2;
  svgNode.y = (height - svgNode.height) / 2;
  preview.appendChild(svgNode);
}

function appendImage(parent: FrameNode, dataUrl: string, x: number, y: number, width: number, height: number, name: string): void {
  const preview = createFrame(`Preview / ${name}`, x, y, width, height, COLORS.board);
  preview.cornerRadius = 8;
  preview.strokes = [{ type: "SOLID", color: COLORS.border }];
  preview.strokeWeight = 1;
  preview.clipsContent = true;
  parent.appendChild(preview);

  const image = figma.createImage(dataUrlToBytes(dataUrl));
  const rect = figma.createRectangle();
  rect.name = `Image / ${name}`;
  rect.x = 0;
  rect.y = 0;
  rect.resize(width, height);
  rect.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: image.hash }];
  preview.appendChild(rect);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
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
  addText(section, title, 24, 20, { size: 22, bold: true, width: width - 48 });
  addText(section, description, 24, 54, { size: 11, color: COLORS.muted, width: width - 48 });
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

function createAutoFrame(name: string, x: number, y: number, width: number, fill: RGB, layoutMode: "VERTICAL" | "HORIZONTAL" = "VERTICAL"): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.x = x;
  frame.y = y;
  frame.resize(width, 1);
  frame.layoutMode = layoutMode;
  frame.primaryAxisSizingMode = layoutMode === "HORIZONTAL" ? "FIXED" : "AUTO";
  frame.counterAxisSizingMode = layoutMode === "HORIZONTAL" ? "AUTO" : "FIXED";
  frame.fills = [{ type: "SOLID", color: fill }];
  frame.clipsContent = false;
  return frame;
}

function createAutoText(characters: string, size: number, bold: boolean, width: number, color: RGB): TextNode {
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

function appendBoard(parent: FrameNode | null, board: FrameNode): void {
  if (parent) {
    parent.appendChild(board);
    return;
  }
  figma.currentPage.appendChild(board);
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
  const visible = items.length > 0 ? items.slice(0, 4) : ["項目はありません。"];
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

function trimForBoard(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  return compact.length > maxLength ? `${compact.slice(0, maxLength - 1)}…` : compact;
}

function renderArrow(parent: FrameNode, x: number, y: number, width: number): void {
  const line = figma.createLine();
  line.name = "Process Arrow";
  line.x = x;
  line.y = y;
  line.resize(width, 0);
  line.strokes = [{ type: "SOLID", color: COLORS.blue }];
  line.strokeWeight = 2;
  parent.appendChild(line);
  const head = figma.createPolygon();
  head.name = "Arrow Head";
  head.pointCount = 3;
  head.x = x + width - 2;
  head.y = y - 5;
  head.resize(10, 10);
  head.rotation = 90;
  head.fills = [{ type: "SOLID", color: COLORS.blue }];
  parent.appendChild(head);
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
