import type { DiagnosisResult, RuleCheckReport } from "../../schemas/diagnosis";
import type { FigmaFrameData, FigmaFrameDerivedData } from "../../schemas/figmaFrame";

const derived: FigmaFrameDerivedData = {
  textCount: 1,
  shapeCount: 0,
  totalTextChars: 14,
  maxFontSize: 48,
  minFontSize: 48,
  colors: ["rgb(17, 24, 39)"],
  colorCount: 1,
  elementDensity: 0.068,
  frameSizeMatchesCanvas: true,
  safeAreaIssues: [],
};

const frame: FigmaFrameData = {
  id: "demo_frame_note",
  name: "Demo Note Thumbnail",
  x: 0,
  y: 0,
  width: 800,
  height: 450,
  textNodes: [
    {
      id: "demo_text_1",
      name: "Headline",
      characters: "AI時代のデザイン思考",
      x: 88,
      y: 105,
      width: 420,
      height: 58,
      fontSize: 48,
      fontName: "Inter Bold",
      fontFamily: "Inter",
      color: "rgb(17, 24, 39)",
      visible: true,
      opacity: 1,
    },
  ],
  shapeNodes: [],
  derived,
};

frame.derived.possibleMainTitle = frame.textNodes[0];

const ruleCheck: RuleCheckReport = {
  id: "rules_demo_frame_note",
  contentType: "note_thumbnail",
  frameId: frame.id,
  frameName: frame.name,
  metrics: frame.derived,
  checks: [
    {
      id: "frameSizeMatchesCanvas",
      label: "800x450 canvas",
      status: "pass",
      severity: "info",
      message: "Frame matches the 800x450 MVP canvas.",
      value: "800x450",
    },
  ],
  createdAt: "2026-05-25T00:00:00.000Z",
};

export const diagnosisSamples: DiagnosisResult[] = [
  {
    id: "diagnosis_demo_frame_note",
    contentType: "note_thumbnail",
    frameId: frame.id,
    frameName: frame.name,
    frame,
    summary: "noteサムネイルとして主題が読み取りやすく、MVPサイズにも合っています。",
    firstImpression: "主見出しが明確で、読み物としての入口を作れています。",
    strengths: ["800x450のMVPサイズに合っています。", "主見出し候補が読み取りやすいです。"],
    concerns: [],
    fixPriority: [],
    rewriteInstructions: [
      {
        label: "派生案を作る",
        instruction: "現在の強みを保ちつつ、訴求軸だけを変えた派生案をExploreで作る。",
        targetWorkflow: "explore",
      },
    ],
    ruleCheck,
    needVisualReview: false,
    createdAt: "2026-05-25T00:00:00.000Z",
  },
];
