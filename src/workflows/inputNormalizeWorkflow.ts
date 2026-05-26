import { CANVAS_SIZE } from "../config/canvas";
import type { ExploreInput, InputSource, NormalizedCreativeInput } from "../schemas/input";

const REQUIRED_INFO = ["制作物", "主題", "ターゲット", "訴求ポイント", "CTA", "日時"];

export async function normalizeCreativeInput(input: ExploreInput): Promise<NormalizedCreativeInput> {
  const source = normalizeInputSource(input.inputMode);
  const baseText = [input.rawInput, input.briefText, input.pdfText, input.referenceFrameSummary, input.fixedCopy?.main, input.fixedCopy?.sub, input.fixedCopy?.cta]
    .filter(Boolean)
    .join("\n");

  const projectName = input.projectName?.trim() || inferProjectName(baseText, source);
  const assumptions = createAssumptions(input, source);
  const missingInfo = REQUIRED_INFO.filter((item) => isMissing(item, input, baseText));

  return {
    inputSource: source,
    contentType: input.contentType,
    canvasSize: CANVAS_SIZE,
    safeArea: { x: 48, y: 40, width: 704, height: 370 },
    projectName,
    goal: input.goal || (input.contentType === "seminar_banner" ? "短時間で学べる価値を伝え、申し込みにつなげる" : "記事の主題を一目で伝え、読みたい気持ちを作る"),
    target: input.targetAudience || "忙しいビジネスパーソン",
    tone: input.tone || "信頼感と親しみやすさ",
    requiredInfo: REQUIRED_INFO,
    missingInfo,
    fixedCopy: source === "fixed_copy" ? input.fixedCopy : undefined,
    briefText: input.briefText || input.rawInput,
    pdfText: input.pdfText,
    pdfFileName: input.pdfFileName,
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

function isMissing(item: string, input: ExploreInput, text: string): boolean {
  if (item === "制作物") return false;
  if (item === "主題") return text.trim().length < 8;
  if (item === "ターゲット") return !input.targetAudience;
  if (item === "訴求ポイント") return !input.briefText && !input.rawInput && !input.fixedCopy?.sub;
  if (item === "CTA") return !input.fixedCopy?.cta && !/参加|申込|申し込|読む|見る|視聴/.test(text);
  if (item === "日時") return !input.fixedCopy?.date && !/\d{1,2}[./月]\d{1,2}|WED|THU|FRI|SAT|SUN|MON|TUE|時/.test(text);
  return false;
}

function createAssumptions(input: ExploreInput, source: InputSource): string[] {
  const assumptions: string[] = [];
  if (!input.targetAudience) assumptions.push("ターゲットは忙しいビジネスパーソンと仮定する");
  if (!input.tone) assumptions.push("トーンは信頼感と親しみやすさを両立する");
  if (!input.fixedCopy?.cta) assumptions.push("CTAは用途に合わせて短く補完する");
  if (source === "minimal_prompt") assumptions.push("不足情報はAIが仮説で補い、後からFigma上で調整できる前提にする");
  if (source === "pdf") assumptions.push("PDFから抽出した要点を優先し、詳細は要件テキストで補完する");
  return assumptions;
}
