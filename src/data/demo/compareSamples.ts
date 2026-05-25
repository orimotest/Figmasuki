import { CANVAS_SIZE } from "../../config/canvas";
import type { BackgroundBrief } from "../../schemas/background";
import type { ComparisonResult, FrameCompareSummary } from "../../schemas/comparison";
import type { RuleCheckReport } from "../../schemas/diagnosis";
import type { FigmaFrameData, FigmaFrameDerivedData } from "../../schemas/figmaFrame";

const emptyDerived: FigmaFrameDerivedData = {
  textCount: 0,
  shapeCount: 0,
  totalTextChars: 0,
  maxFontSize: null,
  minFontSize: null,
  colors: [],
  colorCount: 0,
  elementDensity: 0,
  frameSizeMatchesCanvas: true,
  safeAreaIssues: [],
};

const demoFrameA: FigmaFrameData = {
  id: "demo_frame_a",
  name: "Seminar A",
  x: 0,
  y: 0,
  width: 800,
  height: 450,
  textNodes: [],
  shapeNodes: [],
  derived: emptyDerived,
};

const demoFrameB: FigmaFrameData = {
  id: "demo_frame_b",
  name: "Seminar B",
  x: 840,
  y: 0,
  width: 800,
  height: 450,
  textNodes: [],
  shapeNodes: [],
  derived: emptyDerived,
};

const ruleCheckA: RuleCheckReport = {
  id: "rules_demo_frame_a",
  contentType: "seminar_banner",
  frameId: demoFrameA.id,
  frameName: demoFrameA.name,
  metrics: emptyDerived,
  checks: [],
  createdAt: "2026-05-25T00:00:00.000Z",
};

const frameSummaries: FrameCompareSummary[] = [
  { frame: demoFrameA, ruleCheck: ruleCheckA },
  { frame: demoFrameB, ruleCheck: { ...ruleCheckA, id: "rules_demo_frame_b", frameId: demoFrameB.id, frameName: demoFrameB.name } },
];

const backgroundBrief: BackgroundBrief = {
  id: "brief_demo_seminar",
  contentType: "seminar_banner",
  targetFrameId: "demo_frame_a",
  targetFrameName: "Seminar A",
  mood: "calm tech / trustworthy",
  style: "soft tech gradient with calm geometric accents",
  avoid: ["text", "logos", "watermarks"],
  safeAreaHint: "Keep center readable and avoid busy details under text.",
  suggestedStyleKeywords: ["soft tech gradient", "business calm", "geometric background"],
  promptText: "Clean abstract background for an AI design workflow seminar.",
  frameId: "demo_frame_a",
  prompt: "Clean abstract background for an AI design workflow seminar.",
  negativePrompt: "no text, no logos, no UI screenshots",
  styleNotes: ["trustworthy", "high contrast", "space for editable text"],
};

export const compareSamples: ComparisonResult[] = [
  {
    id: "comparison_demo_seminar",
    contentType: "seminar_banner",
    canvasSize: CANVAS_SIZE,
    frames: [demoFrameA, demoFrameB],
    frameSummaries,
    comparisonSummary: "Seminar A is easier to use as a base candidate, while Seminar B can remain as a secondary direction.",
    frameRoles: [
      {
        frameId: "demo_frame_a",
        frameName: "Seminar A",
        role: "参加メリット型",
        bestFor: "告知の基本要素を保ったベース案",
        strength: "CTA area is easier to find.",
        risk: "日時情報は追加確認が必要です。",
        note: "Demo comparison sample.",
      },
      {
        frameId: "demo_frame_b",
        frameName: "Seminar B",
        role: "信頼感型",
        bestFor: "落ち着いた派生案",
        strength: "Trustworthy tone.",
        risk: "CTA visibility may be weaker.",
        note: "Demo comparison sample.",
      },
    ],
    recommendation: {
      primaryFrameId: "demo_frame_a",
      primaryReason: "Clearer event hierarchy.",
      secondaryFrameId: "demo_frame_b",
      secondaryReason: "Useful as a calmer secondary direction.",
    },
    backgroundBrief,
    nextActions: [
      {
        label: "Finishで背景を生成する",
        action: "finish_background",
        targetFrameId: "demo_frame_a",
        instruction: "Generate only the background for the primary candidate.",
      },
    ],
    createdAt: "2026-05-25T00:00:00.000Z",
    primaryFrameId: "demo_frame_a",
    secondaryFrameIds: ["demo_frame_b"],
    reasons: ["Clearer event hierarchy", "CTA area is easier to find"],
  },
];
