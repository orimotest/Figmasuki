import { CANVAS_SIZE } from "../config/canvas";
import type { ContentType } from "../schemas/content";
import type { RuleCheckReport, RuleCheckResult, RuleCheckStatus } from "../schemas/diagnosis";
import type { FigmaFrameData, FigmaTextNodeData } from "../schemas/figmaFrame";

export function runRuleChecks(frame: FigmaFrameData, contentType: ContentType): RuleCheckReport {
  const checks = [...runCommonChecks(frame), ...runContentChecks(frame, contentType)];

  return {
    id: `rules_${frame.id}_${Date.now().toString(36)}`,
    contentType,
    frameId: frame.id,
    frameName: frame.name,
    metrics: frame.derived,
    checks,
    createdAt: new Date().toISOString(),
  };
}

export function runBasicRuleChecks(frame: FigmaFrameData): RuleCheckResult[] {
  return runRuleChecks(frame, "note_thumbnail").checks;
}

function runCommonChecks(frame: FigmaFrameData): RuleCheckResult[] {
  const derived = frame.derived;
  const density = getElementDensity(frame);
  const margins = getMargins(frame.textNodes);

  return [
    createRangeCheck({
      id: "frameSizeMatchesCanvas",
      label: "800x450 canvas",
      status: derived.frameSizeMatchesCanvas ? "pass" : "warn",
      message: derived.frameSizeMatchesCanvas ? "800x450の固定サイズです。" : "このフレームは800x450ではありません。",
      value: `${frame.width}x${frame.height}`,
    }),
    createRangeCheck({
      id: "textCount",
      label: "Text block count",
      status: derived.textCount === 0 ? "fail" : derived.textCount > 8 ? "warn" : "pass",
      message: derived.textCount === 0 ? "テキストが見つかりません。" : derived.textCount > 8 ? "テキストブロックが多く、視線が散る可能性があります。" : "テキスト数は扱いやすい範囲です。",
      value: derived.textCount,
    }),
    createRangeCheck({
      id: "totalTextChars",
      label: "Total text characters",
      status: derived.totalTextChars > 95 ? "warn" : "pass",
      message: derived.totalTextChars > 95 ? "文字量が多く、一覧や縮小表示で読み切りにくい可能性があります。" : "文字量は読みやすい範囲です。",
      value: derived.totalTextChars,
    }),
    createRangeCheck({
      id: "maxFontSize",
      label: "Max font size",
      status: derived.maxFontSize === null ? "warn" : derived.maxFontSize < 28 ? "warn" : "pass",
      message: derived.maxFontSize === null ? "fontSizeを取得できるテキストがありません。" : derived.maxFontSize < 28 ? "最大文字サイズが小さく、主見出しの視認性が弱い可能性があります。" : "主見出しサイズは読みやすい範囲です。",
      value: derived.maxFontSize,
    }),
    createRangeCheck({
      id: "minFontSize",
      label: "Min font size",
      status: derived.minFontSize !== null && derived.minFontSize < 10 ? "warn" : "pass",
      message: derived.minFontSize !== null && derived.minFontSize < 10 ? "小さすぎるテキストがあり、縮小表示で読みにくい可能性があります。" : "最小文字サイズは許容範囲です。",
      value: derived.minFontSize,
    }),
    createRangeCheck({
      id: "colorCount",
      label: "Color count",
      status: derived.colors.length > 8 ? "warn" : "pass",
      message: derived.colors.length > 8 ? "色数が多く、情報の優先順位が曖昧になる可能性があります。" : "色数は整理されています。",
      value: derived.colors.length,
    }),
    createRangeCheck({
      id: "elementDensity",
      label: "Element density",
      status: density > 0.035 ? "warn" : "pass",
      message: density > 0.035 ? "要素密度が高く、余白や視線誘導が弱まる可能性があります。" : "要素密度は控えめです。",
      value: Number(density.toFixed(3)),
    }),
    createRangeCheck({
      id: "safeAreaOverflow",
      label: "Safe area overflow",
      status: derived.safeAreaIssues.length > 0 ? "warn" : "pass",
      message: derived.safeAreaIssues.length > 0 ? "一部の要素が安全領域から外れています。" : "主要要素は安全領域内に収まっています。",
      value: derived.safeAreaIssues.length,
    }),
    createRangeCheck({
      id: "leftRightMarginRisk",
      label: "Left/right margin",
      status: margins.left < CANVAS_SIZE.safeArea.x || margins.right < CANVAS_SIZE.safeArea.x ? "warn" : "pass",
      message: margins.left < CANVAS_SIZE.safeArea.x || margins.right < CANVAS_SIZE.safeArea.x ? "左右の余白が狭く、トリミング時に窮屈に見える可能性があります。" : "左右余白は確保されています。",
      value: `${margins.left}/${margins.right}`,
    }),
    createRangeCheck({
      id: "topBottomMarginRisk",
      label: "Top/bottom margin",
      status: margins.top < 24 || margins.bottom < 24 ? "warn" : "pass",
      message: margins.top < 24 || margins.bottom < 24 ? "上下の余白が狭く、見出しや補助情報が詰まって見える可能性があります。" : "上下余白は確保されています。",
      value: `${margins.top}/${margins.bottom}`,
    }),
    createRangeCheck({
      id: "tooManyTextBlocks",
      label: "Too many text blocks",
      status: derived.textCount > 7 ? "warn" : "pass",
      message: derived.textCount > 7 ? "テキスト要素が多く、読む順番が分かりにくくなる可能性があります。" : "テキストのまとまりは過剰ではありません。",
      value: derived.textCount,
    }),
    createRangeCheck({
      id: "lowHierarchyRisk",
      label: "Hierarchy contrast",
      status: hasLowHierarchy(frame.textNodes) ? "warn" : "pass",
      message: hasLowHierarchy(frame.textNodes) ? "見出しと補助情報の文字サイズ差が弱く、最初に読む場所が曖昧です。" : "文字階層には十分な差があります。",
      value: getFontRatio(frame.textNodes),
    }),
  ];
}

function runContentChecks(frame: FigmaFrameData, contentType: ContentType): RuleCheckResult[] {
  return contentType === "seminar_banner" ? runSeminarChecks(frame) : runNoteChecks(frame);
}

function runNoteChecks(frame: FigmaFrameData): RuleCheckResult[] {
  const mainTitle = frame.derived.possibleMainTitle;
  const text = allText(frame);
  const smallTextCount = frame.textNodes.filter((node) => (node.fontSize ?? 999) < 14).length;

  return [
    createRangeCheck({
      id: "titleLengthRisk",
      label: "Title length",
      status: mainTitle && mainTitle.characters.trim().length > 32 ? "warn" : "pass",
      message: mainTitle && mainTitle.characters.trim().length > 32 ? "タイトルが長く、一覧上では読み切りにくい可能性があります。" : "タイトル量はnoteサムネイル向きです。",
      value: mainTitle?.characters.trim().length ?? null,
    }),
    createRangeCheck({
      id: "tooManySmallTexts",
      label: "Small text count",
      status: smallTextCount > 2 ? "warn" : "pass",
      message: smallTextCount > 2 ? "小さなテキストが多く、noteサムネイルとして細かく見える可能性があります。" : "小さなテキストは控えめです。",
      value: smallTextCount,
    }),
    createRangeCheck({
      id: "adLikeExpressionRisk",
      label: "Ad-like expression",
      status: /(今すぐ|無料|申し込む|キャンペーン|参加する)/.test(text) ? "warn" : "pass",
      message: /(今すぐ|無料|申し込む|キャンペーン|参加する)/.test(text) ? "noteサムネイルとしては広告感が強い表現が含まれています。" : "過度な広告感は控えめです。",
    }),
    createRangeCheck({
      id: "lowWhitespaceRisk",
      label: "Whitespace",
      status: getElementDensity(frame) > 0.026 || frame.derived.safeAreaIssues.length > 2 ? "warn" : "pass",
      message: getElementDensity(frame) > 0.026 || frame.derived.safeAreaIssues.length > 2 ? "余白が弱く、読み物らしさより情報量が前に出る可能性があります。" : "noteらしい余白が残っています。",
      value: Number(getElementDensity(frame).toFixed(3)),
    }),
    createRangeCheck({
      id: "overExplainedRisk",
      label: "Over explained",
      status: frame.derived.totalTextChars > 70 || frame.derived.textCount > 5 ? "warn" : "pass",
      message: frame.derived.totalTextChars > 70 || frame.derived.textCount > 5 ? "説明要素が多く、読み物の余韻が弱まる可能性があります。" : "説明しすぎていません。",
      value: frame.derived.totalTextChars,
    }),
  ];
}

function runSeminarChecks(frame: FigmaFrameData): RuleCheckResult[] {
  const text = allText(frame);
  const hasCTA = Boolean(frame.derived.possibleCTA);
  const hasDate = Boolean(frame.derived.possibleDate);
  const hasBenefit = /(できる|わかる|学べる|使える|実践|改善|ステップ|ヒント)/.test(text);
  const hasTarget = /(初心者|担当者|マーケ|デザイナー|現場|経営|人事|営業|チーム|BtoB|企業|向け)/i.test(text);

  return [
    createRangeCheck({
      id: "hasCTA",
      label: "CTA presence",
      status: hasCTA ? "pass" : "warn",
      message: hasCTA ? "CTAらしいテキストが見つかりました。" : "CTAや申し込み導線らしいテキストが見つかりません。",
      value: hasCTA,
    }),
    createRangeCheck({
      id: "hasDate",
      label: "Date presence",
      status: hasDate ? "pass" : "warn",
      message: hasDate ? "日時らしい情報が見つかりました。" : "日時情報が見つかりにくい、または不足している可能性があります。",
      value: hasDate,
    }),
    createRangeCheck({
      id: "hasBenefitLikeText",
      label: "Benefit expression",
      status: hasBenefit ? "pass" : "warn",
      message: hasBenefit ? "参加メリットらしい表現が見つかりました。" : "参加メリットを示す表現が弱い可能性があります。",
      value: hasBenefit,
    }),
    createRangeCheck({
      id: "hasTargetLikeText",
      label: "Target audience",
      status: hasTarget ? "pass" : "warn",
      message: hasTarget ? "対象者の手がかりが見つかりました。" : "誰向けのセミナーかを示す手がかりが弱い可能性があります。",
      value: hasTarget,
    }),
    createRangeCheck({
      id: "ctaVisibilityRisk",
      label: "CTA visibility",
      status: hasCTA && (frame.derived.possibleCTA?.fontSize ?? 0) < 14 ? "warn" : hasCTA ? "pass" : "warn",
      message: hasCTA ? "CTAが小さい場合、申し込み導線として見つけにくくなります。" : "CTAがないため、申し込み導線が弱く見えます。",
      value: frame.derived.possibleCTA?.fontSize ?? null,
    }),
    createRangeCheck({
      id: "dateVisibilityRisk",
      label: "Date visibility",
      status: hasDate && (frame.derived.possibleDate?.fontSize ?? 0) < 13 ? "warn" : hasDate ? "pass" : "warn",
      message: hasDate ? "日時が小さい場合、イベント情報として見つけにくくなります。" : "日時情報がないため、イベントバナーとしての情報整理が弱くなります。",
      value: frame.derived.possibleDate?.fontSize ?? null,
    }),
    createRangeCheck({
      id: "informationOverloadRisk",
      label: "Information overload",
      status: frame.derived.totalTextChars > 115 || frame.derived.textCount > 8 ? "warn" : "pass",
      message: frame.derived.totalTextChars > 115 || frame.derived.textCount > 8 ? "情報量が多く、タイトル、日時、CTAの優先順位が埋もれる可能性があります。" : "情報量は扱いやすい範囲です。",
      value: frame.derived.totalTextChars,
    }),
  ];
}

function createRangeCheck(options: {
  id: string;
  label: string;
  status: RuleCheckStatus;
  message: string;
  value?: string | number | boolean | null;
}): RuleCheckResult {
  return {
    id: options.id,
    label: options.label,
    status: options.status,
    severity: options.status === "fail" ? "critical" : options.status === "warn" ? "warning" : "info",
    message: options.message,
    value: options.value,
  };
}

function allText(frame: FigmaFrameData): string {
  return frame.textNodes.map((node) => node.characters).join("\n");
}

function getElementDensity(frame: FigmaFrameData): number {
  const elementArea = [...frame.textNodes, ...frame.shapeNodes].reduce((total, node) => total + node.width * node.height, 0);
  return elementArea / Math.max(frame.width * frame.height, 1);
}

function getMargins(textNodes: FigmaTextNodeData[]): { left: number; right: number; top: number; bottom: number } {
  const visibleNodes = textNodes.filter((node) => node.visible !== false);
  if (visibleNodes.length === 0) {
    return { left: 0, right: 0, top: 0, bottom: 0 };
  }
  const left = Math.min(...visibleNodes.map((node) => node.x));
  const right = CANVAS_SIZE.width - Math.max(...visibleNodes.map((node) => node.x + node.width));
  const top = Math.min(...visibleNodes.map((node) => node.y));
  const bottom = CANVAS_SIZE.height - Math.max(...visibleNodes.map((node) => node.y + node.height));
  return { left, right, top, bottom };
}

function hasLowHierarchy(textNodes: FigmaTextNodeData[]): boolean {
  const ratio = getFontRatio(textNodes);
  return ratio !== null && ratio < 1.45 && textNodes.length > 1;
}

function getFontRatio(textNodes: FigmaTextNodeData[]): number | null {
  const sizes = textNodes.map((node) => node.fontSize).filter((size): size is number => typeof size === "number" && size > 0);
  if (sizes.length < 2) return null;
  return Number((Math.max(...sizes) / Math.min(...sizes)).toFixed(2));
}
