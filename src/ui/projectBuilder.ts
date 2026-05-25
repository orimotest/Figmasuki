import { CANVAS_SIZE } from "../config/canvas";
import { providerConfig } from "../config/providers";
import { createDemoStageWorkflow } from "../data/demo/stagedWorkflowDemo";
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
  const isSeminar = exploreResult.contentType === "seminar_banner";

  return {
    projectId: `project_${Date.now().toString(36)}`,
    projectName: inferProjectName(input),
    contentType: exploreResult.contentType,
    canvasSize: CANVAS_SIZE,
    inputMode: exploreResult.inputMode,
    inputSummary: {
      brief: input.briefText || input.fixedCopy?.main || input.rawInput || "入力要件",
      targetAudience: input.targetAudience ?? (isSeminar ? "忙しいビジネスパーソン" : "デザイナー、編集者、個人クリエイター"),
      goal: isSeminar ? "短時間で学べる価値を伝え、申込につなげる" : "記事を読みたくなる入口を作る",
      rawInput: input.rawInput,
    },
    copyDirections: exploreResult.directions,
    layoutStrategies: createLayoutStrategies(exploreResult.directions),
    svgCandidates,
    diagnosisResults,
    comparisonResult,
    backgroundResult,
    stageWorkflow: createDemoStageWorkflow({ directions: exploreResult.directions, refinedSvgCandidates: svgCandidates, backgroundResult }),
    createdAt: new Date().toISOString(),
    providerMeta: {
      mode: createProviderMode(svgCandidates),
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
  if (input.contentType === "seminar_banner") return "オンラインセミナー集客バナー";
  if (input.fixedCopy?.main) return input.fixedCopy.main.split("\n")[0]?.slice(0, 24) || "AI制作プロジェクト";
  const brief = input.briefText || input.rawInput || "AI制作プロジェクト";
  return brief.replace(/[。\n].*$/s, "").slice(0, 28);
}

function createProviderMode(svgCandidates: SvgCandidate[]): string {
  const fallback = svgCandidates.some((candidate) => candidate.meta.fallbackUsed);
  if (fallback) return "Demo Mode（API未設定またはfallback）";
  if (providerConfig.copy === "demo" && providerConfig.svg === "demo") return "Demo Mode";
  return `copy:${providerConfig.copy} / layout:${providerConfig.layout} / svg:${providerConfig.svg} / diagnosis:${providerConfig.diagnosis} / compare:${providerConfig.compare} / background:${providerConfig.background}`;
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
