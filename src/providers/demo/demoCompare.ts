import { CANVAS_SIZE } from "../../config/canvas";
import type { BackgroundBrief } from "../../schemas/background";
import type { ContentType } from "../../schemas/content";
import type { ComparisonResult, FrameCompareSummary, FrameRole } from "../../schemas/comparison";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import { runRuleChecks } from "../../utils/ruleChecks";

export async function demoCompare(
  frames: FigmaFrameData[],
  contentType: ContentType,
  frameSummaries = frames.map((frame) => ({ frame, ruleCheck: runRuleChecks(frame, contentType) })),
): Promise<ComparisonResult> {
  if (frames.length < 2) {
    throw new Error("比較には2案以上のフレームが必要です。");
  }

  const ranked = [...frameSummaries].sort((a, b) => scoreFrame(b, contentType) - scoreFrame(a, contentType));
  const primary = ranked[0];
  const secondary = ranked[1];
  const frameRoles = frameSummaries.map((summary, index) => buildFrameRole(summary, contentType, index));
  const backgroundBrief = buildBackgroundBrief(primary.frame, contentType);

  return {
    id: `comparison_${Date.now().toString(36)}`,
    contentType,
    canvasSize: CANVAS_SIZE,
    frames,
    frameSummaries,
    comparisonSummary: buildComparisonSummary(contentType, primary.frame.name),
    frameRoles,
    recommendation: {
      primaryFrameId: primary.frame.id,
      primaryReason: buildPrimaryReason(primary, contentType),
      secondaryFrameId: secondary?.frame.id,
      secondaryReason: secondary ? buildSecondaryReason(secondary, contentType) : undefined,
    },
    backgroundBrief,
    nextActions: [
      {
        label: "Finishで背景を生成する",
        action: "finish_background",
        targetFrameId: primary.frame.id,
        instruction: "ベース候補の文字組みを残したまま、背景だけを仕上げます。",
      },
      {
        label: "派生案を作る",
        action: "revise_in_explore",
        targetFrameId: primary.frame.id,
        instruction: "ベース候補の強みを残し、次点候補のよさを一部取り入れた派生案を作ります。",
      },
    ],
    createdAt: new Date().toISOString(),
    primaryFrameId: primary.frame.id,
    secondaryFrameIds: secondary ? [secondary.frame.id] : [],
    reasons: [buildPrimaryReason(primary, contentType), secondary ? buildSecondaryReason(secondary, contentType) : ""].filter(Boolean),
    providerMeta: {
      provider: "demo",
      fallbackUsed: false,
    },
  };
}

function scoreFrame(summary: FrameCompareSummary, contentType: ContentType): number {
  const checks = summary.ruleCheck.checks;
  const warnCount = checks.filter((check) => check.status !== "pass").length;
  const metrics = summary.ruleCheck.metrics;
  let score = 100 - warnCount * 7;
  if (metrics.frameSizeMatchesCanvas) score += 8;
  if (metrics.possibleMainTitle) score += 10;
  if (contentType === "seminar_banner") {
    if (metrics.possibleCTA) score += 14;
    if (metrics.possibleDate) score += 12;
  }
  if (contentType === "note_thumbnail") {
    if (metrics.totalTextChars <= 80) score += 10;
    if (!hasAdLikeText(summary.frame)) score += 8;
  }
  return score;
}

function buildFrameRole(summary: FrameCompareSummary, contentType: ContentType, index: number): FrameRole {
  const title = summary.ruleCheck.metrics.possibleMainTitle?.characters.trim() || summary.frame.name;
  const hasCTA = Boolean(summary.ruleCheck.metrics.possibleCTA);
  const hasDate = Boolean(summary.ruleCheck.metrics.possibleDate);
  const textChars = summary.ruleCheck.metrics.totalTextChars;

  if (contentType === "seminar_banner") {
    return {
      frameId: summary.frame.id,
      frameName: summary.frame.name,
      role: inferRole(summary.frame.name, index),
      bestFor: hasCTA && hasDate ? "告知のベース案" : "訴求軸や構図の検討案",
      strength: hasCTA ? "申し込み導線が見つけやすいです。" : `「${title}」の訴求が中心に見えます。`,
      risk: !hasDate ? "日時情報を補強した方がイベント告知として使いやすくなります。" : textChars > 115 ? "情報量が多く、CTAが埋もれる可能性があります。" : "大きな構造リスクは控えめです。",
      note: "セミナー用途では、タイトル、日時、CTAの順で読めるかを優先して見ています。",
    };
  }

  return {
    frameId: summary.frame.id,
    frameName: summary.frame.name,
    role: inferRole(summary.frame.name, index),
    bestFor: hasAdLikeText(summary.frame) ? "強い訴求の検討案" : "読み物感を保ったnote案",
    strength: `「${title}」を入口にした見せ方です。`,
    risk: hasAdLikeText(summary.frame) ? "note用途としては広告感が強く見える可能性があります。" : textChars > 80 ? "説明量が多く、一覧では読み切りにくい可能性があります。" : "読み物感を損ねるリスクは控えめです。",
    note: "note用途では、押し出す表現より余韻と読みやすさを優先して見ています。",
  };
}

function buildComparisonSummary(contentType: ContentType, primaryName: string): string {
  if (contentType === "seminar_banner") {
    return `${primaryName} は、セミナーバナーとして必要な情報をベースにしやすい候補です。次点案は訴求や雰囲気の派生として参考にできます。`;
  }
  return `${primaryName} は、noteサムネイルとして主題の残り方をベースにしやすい候補です。次点案はトーンや余白の派生として参考にできます。`;
}

function buildPrimaryReason(summary: FrameCompareSummary, contentType: ContentType): string {
  if (contentType === "seminar_banner") {
    return summary.ruleCheck.metrics.possibleCTA && summary.ruleCheck.metrics.possibleDate
      ? "タイトル、日時、CTAの基本要素が揃っており、仕上げ工程へ進めやすいです。"
      : "主見出しの存在が明確で、情報整理のベースにしやすいです。";
  }
  return summary.ruleCheck.metrics.totalTextChars <= 80
    ? "文字量が比較的抑えられており、note一覧でも主題が残りやすいです。"
    : "主見出しの存在が明確で、調整すれば読み物感を作りやすいです。";
}

function buildSecondaryReason(_summary: FrameCompareSummary, contentType: ContentType): string {
  if (contentType === "seminar_banner") {
    return "訴求や情報の見せ方がベース候補と異なるため、派生案の参考にしやすいです。";
  }
  return "トーンや余白感の比較対象として残しておく価値があります。";
}

function buildBackgroundBrief(frame: FigmaFrameData, contentType: ContentType): BackgroundBrief {
  const isSeminar = contentType === "seminar_banner";
  return {
    id: `brief_${frame.id}_${Date.now().toString(36)}`,
    contentType,
    targetFrameId: frame.id,
    targetFrameName: frame.name,
    mood: isSeminar ? "calm tech / trustworthy" : "editorial / quiet / thoughtful",
    style: isSeminar ? "soft tech gradient with calm geometric accents" : "soft paper gradient with subtle abstract lines",
    avoid: ["文字の生成", "ロゴ", "透かし", "中央の細かすぎる装飾"],
    safeAreaHint: "主見出しとCTAの背面は低コントラストにし、文字領域を邪魔しない。",
    suggestedStyleKeywords: isSeminar
      ? ["soft tech gradient", "business calm", "geometric background", "low contrast center"]
      : ["editorial texture", "paper grain", "subtle abstract lines", "quiet contrast"],
    promptText: isSeminar
      ? `${frame.name} に、信頼感のあるソフトなテック系背景を追加する。文字とCTAの背面は読みやすく保つ。`
      : `${frame.name} に、静かな編集感のある背景を追加する。主見出しの余白と可読性を保つ。`,
    frameId: frame.id,
    prompt: isSeminar ? `Create a calm geometric background for ${frame.name}.` : `Create a quiet editorial background for ${frame.name}.`,
    negativePrompt: "text, logo, watermark, busy details",
    styleNotes: isSeminar ? ["soft tech gradient", "calm business pattern"] : ["editorial texture", "soft paper gradient"],
  };
}

function inferRole(name: string, index: number): string {
  const lowered = name.toLowerCase();
  if (lowered.includes("benefit")) return "参加メリット型";
  if (lowered.includes("practical")) return "実践ノウハウ型";
  if (lowered.includes("trust")) return "信頼感型";
  if (lowered.includes("question")) return "問いかけ型";
  if (lowered.includes("editorial")) return "余白・編集感型";
  return `候補案 ${index + 1}`;
}

function hasAdLikeText(frame: FigmaFrameData): boolean {
  return /(今すぐ|無料|申し込む|キャンペーン|参加する)/.test(frame.textNodes.map((node) => node.characters).join("\n"));
}
