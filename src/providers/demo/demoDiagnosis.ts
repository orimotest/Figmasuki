import type { ContentType } from "../../schemas/content";
import type { DiagnosisResult, FixPriorityItem, RewriteInstruction, RuleCheckReport } from "../../schemas/diagnosis";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import { runRuleChecks } from "../../utils/ruleChecks";

export async function demoDiagnose(
  frame: FigmaFrameData,
  contentType: ContentType,
  ruleCheck: RuleCheckReport = runRuleChecks(frame, contentType),
): Promise<DiagnosisResult> {
  const concerns = buildConcerns(contentType, ruleCheck);
  const fixPriority = buildFixPriority(contentType, ruleCheck);
  const rewriteInstructions = buildRewriteInstructions(contentType, ruleCheck);

  return {
    id: `diagnosis_${frame.id}_${Date.now().toString(36)}`,
    contentType,
    frameId: frame.id,
    frameName: frame.name,
    frame,
    summary:
      contentType === "seminar_banner"
        ? "セミナーバナーとしての情報設計を確認しました。タイトル、日時、CTAの読み順を整えると、参加判断がさらにしやすくなります。"
        : "noteサムネイルとしての入口を確認しました。広告感を抑えつつ、最初に残る問いや主張を強めると読み物として見えやすくなります。",
    firstImpression: buildFirstImpression(contentType, ruleCheck),
    strengths: buildStrengths(contentType, ruleCheck),
    concerns,
    fixPriority,
    rewriteInstructions,
    ruleCheck,
    needVisualReview: ruleCheck.checks.some((check) => check.status !== "pass"),
    createdAt: new Date().toISOString(),
    providerMeta: {
      provider: "demo",
      fallbackUsed: false,
    },
  };
}

function buildFirstImpression(contentType: ContentType, report: RuleCheckReport): string {
  const title = report.metrics.possibleMainTitle?.characters.trim();
  const titleText = title ? `最初に「${title}」が主見出しとして読めます。` : "主見出し候補が少し弱く見えます。";
  if (contentType === "seminar_banner") {
    return `${titleText} セミナー用途では、この直後に日時とCTAが見つかるかが重要です。`;
  }
  return `${titleText} note用途では、強い売り文句よりも、読者が続きを読みたくなる余韻があるかを優先します。`;
}

function buildStrengths(contentType: ContentType, report: RuleCheckReport): string[] {
  const strengths: string[] = [];
  const passed = (id: string) => report.checks.find((check) => check.id === id)?.status === "pass";

  if (passed("frameSizeMatchesCanvas")) strengths.push("800x450の固定サイズに合っており、生成候補同士を比較しやすいです。");
  if (passed("lowHierarchyRisk")) strengths.push("主見出しと補助情報の階層差があり、読む順番を作れています。");
  if (contentType === "seminar_banner" && passed("hasCTA")) strengths.push("CTAがあり、参加への導線を作れています。");
  if (contentType === "seminar_banner" && passed("hasDate")) strengths.push("日時情報があり、イベント告知として成立しやすいです。");
  if (contentType === "note_thumbnail" && passed("adLikeExpressionRisk")) strengths.push("広告感が強すぎず、noteらしい読み物感を保てています。");
  if (contentType === "note_thumbnail" && passed("overExplainedRisk")) strengths.push("説明量が抑えられており、一覧画面でも主題が残りやすいです。");

  return strengths.length > 0 ? strengths : ["構造データは取得できています。視覚的な強みはFigma上で目視確認してください。"];
}

function buildConcerns(contentType: ContentType, report: RuleCheckReport): string[] {
  const concerns = report.checks.filter((check) => check.status !== "pass").map((check) => check.message);

  if (contentType === "seminar_banner") {
    if (isWarn(report, "hasCTA")) concerns.unshift("CTAが見つかりにくく、申し込み導線が弱く見える可能性があります。");
    if (isWarn(report, "hasDate")) concerns.unshift("日時情報が見つかりにくく、イベント告知として判断材料が不足する可能性があります。");
    if (isWarn(report, "hasBenefitLikeText")) concerns.push("参加メリットが弱いと、ユーザーが参加する理由を判断しにくくなります。");
  } else {
    if (isWarn(report, "adLikeExpressionRisk")) concerns.unshift("noteサムネイルとしては広告感が強く、読み物感が弱まる可能性があります。");
    if (isWarn(report, "titleLengthRisk")) concerns.unshift("タイトルが長く、一覧上では読み切りにくい可能性があります。");
    if (isWarn(report, "overExplainedRisk")) concerns.push("説明量が多く、記事の余韻より情報量が前に出ています。");
  }

  return Array.from(new Set(concerns)).slice(0, 8);
}

function buildFixPriority(contentType: ContentType, report: RuleCheckReport): FixPriorityItem[] {
  const items: FixPriorityItem[] = [];

  if (isWarn(report, "frameSizeMatchesCanvas")) {
    items.push({
      target: "Frame size",
      issue: "800x450ではありません。",
      suggestion: "比較と仕上げを安定させるため、まずフレームサイズを800x450に合わせてください。",
      priority: "high",
    });
  }

  if (contentType === "seminar_banner") {
    if (isWarn(report, "hasCTA")) {
      items.push({ target: "CTA", issue: "CTAが弱い、または見つかりません。", suggestion: "「無料で参加する」など、申し込み行動が分かる短いCTAを追加してください。", priority: "high" });
    }
    if (isWarn(report, "hasDate")) {
      items.push({ target: "Date", issue: "日時情報が弱いです。", suggestion: "日付と時間を独立した情報ブロックとして追加してください。", priority: "high" });
    }
    if (isWarn(report, "hasBenefitLikeText")) {
      items.push({ target: "Benefit", issue: "参加メリットが弱いです。", suggestion: "「60分でわかる」「明日から使える」のように、得られる内容を補助コピーへ入れてください。", priority: "medium" });
    }
  } else {
    if (isWarn(report, "titleLengthRisk")) {
      items.push({ target: "Title", issue: "タイトルが長いです。", suggestion: "主見出しを2から3行に収め、最も残したい言葉だけに絞ってください。", priority: "high" });
    }
    if (isWarn(report, "adLikeExpressionRisk")) {
      items.push({ target: "Tone", issue: "広告感が強い表現があります。", suggestion: "CTAや無料訴求を弱め、問いや主張を中心にしてください。", priority: "medium" });
    }
    if (isWarn(report, "lowWhitespaceRisk")) {
      items.push({ target: "Whitespace", issue: "余白が少なめです。", suggestion: "装飾や補助情報を減らし、主見出しの周囲に余白を残してください。", priority: "medium" });
    }
  }

  if (isWarn(report, "lowHierarchyRisk")) {
    items.push({ target: "Text hierarchy", issue: "文字階層が弱いです。", suggestion: "主見出しを大きくし、補助コピーは一段小さくして読む順番を明確にしてください。", priority: "medium" });
  }

  return items.slice(0, 5);
}

function buildRewriteInstructions(contentType: ContentType, report: RuleCheckReport): RewriteInstruction[] {
  const instructions: RewriteInstruction[] = [];

  if (contentType === "seminar_banner") {
    if (isWarn(report, "hasCTA")) {
      instructions.push({ label: "CTAを明確にした案", instruction: "申し込みボタンを1つ追加し、タイトル、日時、CTAの順で読めるセミナーバナー案を作る。", targetWorkflow: "explore" });
    }
    if (isWarn(report, "hasDate")) {
      instructions.push({ label: "日時を強調する案", instruction: "日時を独立した情報ブロックにし、イベント情報がすぐ見つかるレイアウト案を作る。", targetWorkflow: "generate_svg" });
    }
  } else {
    if (isWarn(report, "adLikeExpressionRisk")) {
      instructions.push({ label: "読み物感を強める案", instruction: "広告的なCTAを避け、問いや主張を中心にしたnoteサムネイル案を作る。", targetWorkflow: "explore" });
    }
    if (isWarn(report, "titleLengthRisk")) {
      instructions.push({ label: "タイトルを短くする案", instruction: "主見出しを短くし、一覧画面で読み切れる文字量のSVG案を作る。", targetWorkflow: "generate_svg" });
    }
  }

  if (isWarn(report, "safeAreaOverflow")) {
    instructions.push({ label: "安全領域に収める案", instruction: "重要な文字とCTAをsafe area内に収め、端に寄りすぎないSVG案を作る。", targetWorkflow: "generate_svg" });
  }

  if (instructions.length === 0) {
    instructions.push({ label: "派生案を作る", instruction: "現在の強みを保ちながら、訴求軸だけを変えた派生案をExploreで作る。", targetWorkflow: "explore" });
  }

  return instructions;
}

function isWarn(report: RuleCheckReport, id: string): boolean {
  const status = report.checks.find((check) => check.id === id)?.status;
  return status === "warn" || status === "fail";
}
