import { CANVAS_SIZE } from "../../config/canvas";
import type { BackgroundBrief } from "../../schemas/background";
import type { ContentType } from "../../schemas/content";
import type { ComparisonResult, FrameCompareSummary, FrameRole } from "../../schemas/comparison";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import { isRecord } from "../../utils/guards";
import { runRuleChecks } from "../../utils/ruleChecks";
import { callGeminiText } from "./geminiClient";

export async function compareWithGemini(
  frames: FigmaFrameData[],
  contentType: ContentType,
  frameSummaries = frames.map((frame) => ({ frame, ruleCheck: runRuleChecks(frame, contentType) })),
): Promise<ComparisonResult> {
  if (frames.length < 2) throw new Error("比較には2案以上のフレームが必要です。");
  const output = await callGeminiText({
    prompt: buildComparePrompt(frames, contentType, frameSummaries),
    temperature: 0.35,
    timeoutMs: 45_000,
  });
  const parsed = parseJsonObject(output);
  const primaryFrameId = readFrameId(isRecord(parsed) ? parsed.primaryFrameId : undefined, frames[0].id, frames);
  const secondaryFrameId = readFrameId(isRecord(parsed) ? parsed.secondaryFrameId : undefined, frames.find((frame) => frame.id !== primaryFrameId)?.id, frames);
  const primaryFrame = frames.find((frame) => frame.id === primaryFrameId) ?? frames[0];

  return {
    id: `gemini_comparison_${Date.now().toString(36)}`,
    contentType,
    canvasSize: CANVAS_SIZE,
    frames,
    frameSummaries,
    comparisonSummary: readString(isRecord(parsed) ? parsed.comparisonSummary : undefined, `${primaryFrame.name} をベース候補として整理しました。`),
    frameRoles: normalizeFrameRoles(isRecord(parsed) ? parsed.frameRoles : undefined, frames),
    recommendation: {
      primaryFrameId,
      primaryReason: readString(isRecord(parsed) ? parsed.primaryReason : undefined, "情報の読み順と用途への適合が比較的安定しています。"),
      secondaryFrameId,
      secondaryReason: secondaryFrameId ? readString(isRecord(parsed) ? parsed.secondaryReason : undefined, "派生案の参考にできます。") : undefined,
    },
    backgroundBrief: buildBackgroundBrief(primaryFrame, contentType, parsed),
    nextActions: [
      {
        label: "Finishで背景を生成する",
        action: "finish_background",
        targetFrameId: primaryFrameId,
        instruction: "ベース候補の文字組みを保ち、背景だけを仕上げます。",
      },
      {
        label: "手動で微調整する",
        action: "manual_adjust",
        targetFrameId: primaryFrameId,
        instruction: "CTA、日時、主見出しの余白をFigma上で確認します。",
      },
    ],
    createdAt: new Date().toISOString(),
    primaryFrameId,
    secondaryFrameIds: secondaryFrameId ? [secondaryFrameId] : [],
    reasons: [
      readString(isRecord(parsed) ? parsed.primaryReason : undefined, "情報の読み順と用途への適合が比較的安定しています。"),
      secondaryFrameId ? readString(isRecord(parsed) ? parsed.secondaryReason : undefined, "派生案の参考にできます。") : "",
    ].filter(Boolean),
    providerMeta: {
      provider: "gemini",
      fallbackUsed: false,
    },
  };
}

function buildComparePrompt(frames: FigmaFrameData[], contentType: ContentType, frameSummaries: FrameCompareSummary[]): string {
  return `Return JSON only. Compare these Japanese Figma banner candidates and choose a primary.
Schema:
{
  "comparisonSummary": string,
  "primaryFrameId": string,
  "primaryReason": string,
  "secondaryFrameId": string,
  "secondaryReason": string,
  "frameRoles": [{"frameId": string, "role": string, "bestFor": string, "strength": string, "risk": string, "note": string}],
  "backgroundMood": string,
  "backgroundStyle": string,
  "backgroundPrompt": string
}

Content type: ${contentType}
Frames:
${JSON.stringify(frames.map((frame) => ({ id: frame.id, name: frame.name, text: frame.textNodes.map((node) => node.characters) })), null, 2)}
Rule checks:
${JSON.stringify(frameSummaries.map((summary) => ({ frameId: summary.frame.id, checks: summary.ruleCheck.checks, metrics: summary.ruleCheck.metrics })), null, 2)}`;
}

function normalizeFrameRoles(value: unknown, frames: FigmaFrameData[]): FrameRole[] {
  if (!Array.isArray(value)) return frames.map((frame, index) => fallbackRole(frame, index));
  const roles = value.filter(isRecord).map((item, index) => {
    const frame = frames.find((candidate) => candidate.id === item.frameId) ?? frames[index] ?? frames[0];
    return {
      frameId: frame.id,
      frameName: frame.name,
      role: readString(item.role, `候補案 ${index + 1}`),
      bestFor: readString(item.bestFor, "ベース候補の検討"),
      strength: readString(item.strength, "主題を伝える要素があります。"),
      risk: readString(item.risk, "余白と読み順の確認が必要です。"),
      note: readString(item.note, "用途との相性を確認します。"),
    };
  });
  return roles.length ? roles : frames.map((frame, index) => fallbackRole(frame, index));
}

function fallbackRole(frame: FigmaFrameData, index: number): FrameRole {
  return {
    frameId: frame.id,
    frameName: frame.name,
    role: `候補案 ${index + 1}`,
    bestFor: "ベース候補の検討",
    strength: "主題を伝える要素があります。",
    risk: "余白と読み順の確認が必要です。",
    note: "用途との相性を確認します。",
  };
}

function buildBackgroundBrief(frame: FigmaFrameData, contentType: ContentType, parsed: unknown): BackgroundBrief {
  return {
    id: `brief_${frame.id}_${Date.now().toString(36)}`,
    contentType,
    targetFrameId: frame.id,
    targetFrameName: frame.name,
    mood: readString(isRecord(parsed) ? parsed.backgroundMood : undefined, "calm trustworthy"),
    style: readString(isRecord(parsed) ? parsed.backgroundStyle : undefined, "soft gradient with subtle geometric accents"),
    avoid: ["文字の生成", "ロゴ", "透かし", "中央の細かすぎる装飾"],
    safeAreaHint: "主見出しとCTAの背面は低コントラストにし、文字領域を邪魔しない。",
    suggestedStyleKeywords: ["low contrast", "editable svg", "safe background", "subtle accent"],
    promptText: readString(isRecord(parsed) ? parsed.backgroundPrompt : undefined, `${frame.name} の文字を邪魔しない背景を作る。`),
    frameId: frame.id,
    prompt: readString(isRecord(parsed) ? parsed.backgroundPrompt : undefined, `Create a subtle background for ${frame.name}.`),
    negativePrompt: "text, logo, watermark, busy details",
    styleNotes: ["Gemini comparison brief", "editable background"],
  };
}

function readFrameId(value: unknown, fallback: string | undefined, frames: FigmaFrameData[]): string {
  return typeof value === "string" && frames.some((frame) => frame.id === value) ? value : fallback ?? frames[0].id;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const source = fenced?.[1] ?? trimmed;
  const objectStart = source.indexOf("{");
  const objectEnd = source.lastIndexOf("}");
  if (objectStart < 0 || objectEnd <= objectStart) throw new Error("Gemini compare did not return JSON.");
  return JSON.parse(source.slice(objectStart, objectEnd + 1));
}
