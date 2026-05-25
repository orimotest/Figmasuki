import type { BackgroundResult } from "./background";
import type { CanvasSize } from "./canvas";
import type { ComparisonResult } from "./comparison";
import type { ContentType } from "./content";
import type { DiagnosisResult } from "./diagnosis";
import type { Direction } from "./direction";
import type { InputMode } from "./input";
import type { ProviderMeta } from "./provider";
import type { FigmaOutputRecord, ProductionStatus } from "./production";
import type { SvgCandidate } from "./svg";
import type { StageWorkflowData } from "./workflow";

export type InputSummary = {
  brief: string;
  targetAudience?: string;
  goal?: string;
  rawInput?: string;
};

export type LayoutStrategy = {
  id: string;
  directionId: string;
  directionName: string;
  layoutType: string;
  composition: string;
  hierarchy: string[];
  colorDirection: string;
  typography: string;
  background: string;
  svgNotes: string[];
};

export type ProjectProviderMeta = {
  mode: string;
  copy?: ProviderMeta;
  layout?: ProviderMeta;
  svg?: ProviderMeta;
  diagnosis?: ProviderMeta;
  compare?: ProviderMeta;
  background?: ProviderMeta;
};

export type ProjectData = {
  projectId: string;
  projectName: string;
  contentType: ContentType;
  canvasSize: CanvasSize;
  inputMode: InputMode;
  inputSummary: InputSummary;
  copyDirections: Direction[];
  layoutStrategies: LayoutStrategy[];
  svgCandidates: SvgCandidate[];
  diagnosisResults: DiagnosisResult[];
  comparisonResult?: ComparisonResult;
  backgroundResult?: BackgroundResult;
  stageWorkflow?: StageWorkflowData;
  productionStatus?: ProductionStatus;
  stageResults?: {
    ideas?: StageWorkflowData["ideaDirections"];
    typographyDrafts?: StageWorkflowData["typographyDrafts"];
    refinedCandidates?: StageWorkflowData["refinedSvgCandidates"];
    comparison?: ComparisonResult;
    backgroundVariations?: StageWorkflowData["backgroundVariations"];
    finalCandidate?: StageWorkflowData["finalCandidate"];
  };
  figmaOutputs?: FigmaOutputRecord[];
  createdAt: string;
  providerMeta: ProjectProviderMeta;
};

export function createLayoutStrategies(directions: Direction[]): LayoutStrategy[] {
  return directions.map((direction) => ({
    id: `strategy_${direction.id}`,
    directionId: direction.id,
    directionName: direction.title,
    layoutType: direction.layoutType,
    composition: direction.layoutBrief.composition || direction.layoutBrief.description,
    hierarchy: direction.layoutBrief.hierarchy,
    colorDirection: direction.styleBrief.palette.join(" / "),
    typography: direction.styleBrief.typography,
    background: direction.styleBrief.mood,
    svgNotes: direction.layoutBrief.constraints ?? ["重要な文字をsafe area内に収める", "テキストは編集可能なSVG textとして残す"],
  }));
}
