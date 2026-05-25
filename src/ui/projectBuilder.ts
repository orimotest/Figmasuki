import { CANVAS_SIZE } from "../config/canvas";
import { providerConfig } from "../config/providers";
import type { BackgroundResult } from "../schemas/background";
import type { ComparisonResult } from "../schemas/comparison";
import type { DiagnosisResult } from "../schemas/diagnosis";
import type { ExploreInput } from "../schemas/input";
import type { ProjectData } from "../schemas/project";
import { createLayoutStrategies } from "../schemas/project";
import type { ExploreResult, SvgCandidate } from "../schemas/svg";

export function buildProjectData(params: {
  exploreResult: ExploreResult;
  svgCandidates: SvgCandidate[];
  diagnosisResults?: DiagnosisResult[];
  comparisonResult?: ComparisonResult;
  backgroundResult?: BackgroundResult;
}): ProjectData {
  const { exploreResult, svgCandidates, diagnosisResults = [], comparisonResult, backgroundResult } = params;
  const input = exploreResult.input;
  return {
    projectId: `project_${Date.now().toString(36)}`,
    projectName: inferProjectName(input),
    contentType: exploreResult.contentType,
    canvasSize: CANVAS_SIZE,
    inputMode: exploreResult.inputMode,
    inputSummary: {
      brief: input.briefText || input.fixedCopy?.main || input.rawInput || "入力要件",
      targetAudience: input.targetAudience,
      goal: exploreResult.contentType === "seminar_banner" ? "セミナー参加者の獲得" : "記事を読みたくなる入口づくり",
      rawInput: input.rawInput,
    },
    copyDirections: exploreResult.directions,
    layoutStrategies: createLayoutStrategies(exploreResult.directions),
    svgCandidates,
    diagnosisResults,
    comparisonResult,
    backgroundResult,
    createdAt: new Date().toISOString(),
    providerMeta: {
      mode: `copy:${providerConfig.copy} / layout:${providerConfig.layout} / svg:${providerConfig.svg} / diagnosis:${providerConfig.diagnosis} / compare:${providerConfig.compare} / background:${providerConfig.background}`,
      copy: exploreResult.providerMeta,
      layout: exploreResult.providerMeta,
      svg: svgCandidates.find((candidate) => candidate.meta.fallbackUsed)?.meta
        ? {
            provider: svgCandidates[0]?.meta.provider ?? "demo",
            fallbackUsed: Boolean(svgCandidates.find((candidate) => candidate.meta.fallbackUsed)),
            fallbackReason: svgCandidates.find((candidate) => candidate.meta.fallbackReason)?.meta.fallbackReason,
          }
        : undefined,
      diagnosis: diagnosisResults[0]?.providerMeta,
      compare: comparisonResult?.providerMeta,
      background: backgroundResult?.providerMeta,
    },
  };
}

function inferProjectName(input: ExploreInput): string {
  if (input.contentType === "seminar_banner") return "はじめてのAI活用セミナー";
  if (input.fixedCopy?.main) return input.fixedCopy.main.split("\n")[0]?.slice(0, 24) || "AI制作プロジェクト";
  const brief = input.briefText || input.rawInput || "AI制作プロジェクト";
  return brief.replace(/[。.\n].*$/s, "").slice(0, 28);
}
