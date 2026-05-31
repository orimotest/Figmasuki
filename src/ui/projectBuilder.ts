import { CANVAS_SIZE } from "../config/canvas";
import { getRuntimeExecutionModeLabel } from "../config/runtimeApiSettings";
import { createDemoStageWorkflow } from "../data/demo/stagedWorkflowDemo";
import type { BackgroundResult } from "../schemas/background";
import type { ComparisonResult } from "../schemas/comparison";
import type { DiagnosisResult } from "../schemas/diagnosis";
import type { ExploreInput } from "../schemas/input";
import type { ProjectData } from "../schemas/project";
import { createLayoutStrategies } from "../schemas/project";
import type { FigmaOutputRecord, ProductionStatus } from "../schemas/production";
import type { ExploreResult, SvgCandidate } from "../schemas/svg";

export function buildProjectData(params: {
  exploreResult: ExploreResult;
  svgCandidates: SvgCandidate[];
  diagnosisResults?: DiagnosisResult[];
  comparisonResult?: ComparisonResult;
  backgroundResult?: BackgroundResult;
  productionStatus?: ProductionStatus;
  figmaOutputs?: FigmaOutputRecord[];
}): ProjectData {
  const { exploreResult, svgCandidates, diagnosisResults = [], comparisonResult, backgroundResult, productionStatus, figmaOutputs = [] } = params;
  const input = exploreResult.input;
  const isSeminar = exploreResult.contentType === "seminar_banner";
  const stageWorkflow = createDemoStageWorkflow({ directions: exploreResult.directions, refinedSvgCandidates: svgCandidates, comparisonResult, backgroundResult });

  return {
    projectId: `project_${Date.now().toString(36)}`,
    projectName: inferProjectName(input),
    contentType: exploreResult.contentType,
    canvasSize: CANVAS_SIZE,
    inputMode: exploreResult.inputMode,
    inputSummary: {
      brief: input.briefText || input.fixedCopy?.main || input.rawInput || "入力要件",
      targetAudience: input.targetAudience ?? (isSeminar ? "忙しいビジネスパーソン" : "デザイナー、編集者、個人クリエイター"),
      goal: input.goal ?? (isSeminar ? "短時間で学べる価値を伝え、申込につなげる" : "記事を読みたくなる入口を作る"),
      rawInput: input.rawInput,
    },
    copyDirections: exploreResult.directions,
    layoutStrategies: createLayoutStrategies(exploreResult.directions),
    svgCandidates,
    diagnosisResults,
    comparisonResult,
    backgroundResult,
    stageWorkflow,
    productionStatus,
    stageResults: {
      ideas: stageWorkflow.ideaDirections,
      typographyDrafts: stageWorkflow.typographyDrafts,
      refinedCandidates: stageWorkflow.refinedSvgCandidates,
      comparison: comparisonResult,
      backgroundVariations: stageWorkflow.backgroundVariations,
      finalCandidate: stageWorkflow.finalCandidate,
      finalCandidates: stageWorkflow.finalCandidates,
    },
    figmaOutputs,
    createdAt: new Date().toISOString(),
    providerMeta: {
      mode: createProviderMode(exploreResult, svgCandidates),
      copy: exploreResult.providerMeta,
      layout: exploreResult.providerMeta,
      svg: createSvgProviderMeta(svgCandidates),
      diagnosis: diagnosisResults[0]?.providerMeta,
      compare: comparisonResult?.providerMeta,
      background: backgroundResult?.providerMeta,
    },
  };
}

function inferProjectName(input: ExploreInput): string {
  if (input.projectName) return input.projectName;
  if (input.contentType === "seminar_banner") return "オンラインセミナー集客バナー";
  if (input.fixedCopy?.main) return input.fixedCopy.main.split("\n")[0]?.slice(0, 24) || "AI制作プロジェクト";
  const brief = input.briefText || input.rawInput || "AI制作プロジェクト";
  return brief.replace(/[。\n].*$/s, "").slice(0, 28);
}

function createProviderMode(exploreResult: ExploreResult, svgCandidates: SvgCandidate[]): string {
  const exploreFallback = exploreResult.providerMeta?.fallbackUsed;
  const fallback = svgCandidates.some((candidate) => candidate.meta.fallbackUsed);
  if (fallback || exploreFallback) return "代替処理あり";
  if (exploreResult.providerMeta?.provider === "dify" || svgCandidates.some((candidate) => candidate.meta.provider === "gemini")) {
    return "API接続中";
  }
  return getRuntimeExecutionModeLabel() === "API" ? "API接続中" : "API未接続";
}

function createSvgProviderMeta(svgCandidates: SvgCandidate[]) {
  const fallbackCandidate = svgCandidates.find((candidate) => candidate.meta.fallbackUsed);
  if (!fallbackCandidate) return undefined;
  return {
    provider: svgCandidates[0]?.meta.provider ?? "demo",
    fallbackUsed: true,
    fallbackReason: fallbackCandidate.meta.fallbackReason,
  };
}
