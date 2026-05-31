import { CANVAS_SIZE } from "../config/canvas";
import type { ExploreInput, InputSource, NormalizedCreativeInput } from "../schemas/input";
import { normalizeRichTextInput } from "../utils/markdown/normalizeRichText";

const REQUIRED_INFO = ["制作物", "主題", "ターゲット", "訴求ポイント", "CTA", "日時"];

export async function normalizeCreativeInput(input: ExploreInput): Promise<NormalizedCreativeInput> {
  const source = normalizeInputSource(input.inputMode);
  const markdownSummary = input.markdownText ? normalizeRichTextInput(input.markdownText) : undefined;
  const baseText = [input.rawInput, input.briefText, input.markdownText, input.pdfText, input.referenceFrameSummary, input.fixedCopy?.main, input.fixedCopy?.sub, input.fixedCopy?.cta]
    .filter(Boolean)
    .join("\n");

  const projectName = input.projectName?.trim() || inferProjectName(baseText, source);
  const inferredTarget = input.targetAudience || extractLabeledValue(baseText, ["対象", "ターゲット", "参加者", "読者", "Target"]);
  const inferredGoal = input.goal || extractLabeledValue(baseText, ["目的", "ゴール", "訴求", "訴求ポイント", "Goal"]);
  const inferredTone = input.tone || extractLabeledValue(baseText, ["トーン", "雰囲気", "Tone"]);
  const inferredCta = input.fixedCopy?.cta || extractLabeledValue(baseText, ["CTA", "申し込み", "行動"]);
  const inferredDate = input.fixedCopy?.date || extractLabeledValue(baseText, ["日時", "日程", "開催日", "Date"]);
  const assumptions = createAssumptions(input, source, { target: inferredTarget, tone: inferredTone, cta: inferredCta });
  const missingInfo = REQUIRED_INFO.filter((item) => isMissing(item, input, baseText, { target: inferredTarget, goal: inferredGoal, cta: inferredCta, date: inferredDate }));

  return {
    inputSource: source,
    contentType: input.contentType,
    canvasSize: CANVAS_SIZE,
    safeArea: { x: 48, y: 40, width: 704, height: 370 },
    projectName,
    goal: inferredGoal || (input.contentType === "seminar_banner" ? "短時間で学べる価値を伝え、申し込みにつなげる" : "記事の主題を一目で伝え、読みたい気持ちを作る"),
    target: inferredTarget || "忙しいビジネスパーソン",
    tone: inferredTone || "信頼感と親しみやすさ",
    requiredInfo: REQUIRED_INFO,
    missingInfo,
    fixedCopy: source === "fixed_copy" ? input.fixedCopy : undefined,
    briefText: input.briefText || input.rawInput,
    pdfText: input.pdfText,
    pdfFileName: input.pdfFileName,
    markdownText: input.markdownText,
    requirementBlocks: input.requirementBlocks ?? markdownSummary?.blocks,
    referenceFrameSummary: input.referenceFrameSummary,
    assumptions,
  };
}

function normalizeInputSource(mode: ExploreInput["inputMode"]): InputSource {
  if (mode === "figma_variation") return "figma_reference";
  return mode;
}

function inferProjectName(text: string, source: InputSource): string {
  if (text.includes("AI")) return "AI活用セミナー集客バナー";
  if (source === "pdf") return "資料から作る制作案件";
  return "新規制作案件";
}

function isMissing(
  item: string,
  input: ExploreInput,
  text: string,
  inferred: { target?: string; goal?: string; cta?: string; date?: string },
): boolean {
  if (item === "制作物") return false;
  if (item === "主題") return text.trim().length < 8;
  if (item === "ターゲット") return !inferred.target;
  if (item === "訴求ポイント") return !inferred.goal && !input.briefText && !input.rawInput && !input.fixedCopy?.sub;
  if (item === "CTA") return !inferred.cta && !/参加|申込|申し込|読む|見る|視聴/.test(text);
  if (item === "日時") return !inferred.date && !/\d{1,2}[./月]\d{1,2}|WED|THU|FRI|SAT|SUN|MON|TUE|時/.test(text);
  return false;
}

function createAssumptions(input: ExploreInput, source: InputSource, inferred: { target?: string; tone?: string; cta?: string }): string[] {
  const assumptions: string[] = [];
  if (!inferred.target) assumptions.push("ターゲットは忙しいビジネスパーソンと仮定する");
  if (!inferred.tone) assumptions.push("トーンは信頼感と親しみやすさを両立する");
  if (!inferred.cta) assumptions.push("CTAは用途に合わせて短く補完する");
  if (source === "minimal_prompt") assumptions.push("不足情報はAIが仮説で補い、後からFigma上で調整できる前提にする");
  if (source === "pdf") assumptions.push("PDFから抽出した要点を優先し、詳細は要件テキストで補完する");
  if (source === "markdown") assumptions.push("Markdownの見出し、リスト、表を要件構造として扱い、Figma上の要件ボードにも残す");
  return assumptions;
}

function extractLabeledValue(text: string, labels: string[]): string | undefined {
  const normalized = text.replace(/\r\n/g, "\n");
  for (const label of labels) {
    const escaped = escapeRegExp(label);
    const match = new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?(?:#{1,3}\\s*)?${escaped}\\s*[:：]\\s*(.+)`, "i").exec(normalized);
    if (match?.[1]) return match[1].trim().replace(/\s{2,}/g, " ");
  }
  return undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
