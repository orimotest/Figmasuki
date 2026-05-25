import type { BackgroundResult } from "./background";
import type { TypographyDraftLayoutType } from "./layoutDraft";
import type { SvgCandidate } from "./svg";

export type IdeaDirectionStatus = "selected_for_typography" | "rejected" | "merged";

export type IdeaDirection = {
  id: string;
  name: string;
  mainCopy: string;
  subCopy: string;
  cta?: string;
  intent: string;
  tone: string;
  layoutHint: string;
  risk: string;
  bestFor: string;
  status: IdeaDirectionStatus;
  selectionReason?: string;
};

export type TypographyDraft = {
  id: string;
  sourceIdeaId: string;
  name: string;
  directionName: string;
  layoutType: TypographyDraftLayoutType;
  svg: string;
  evaluationMemo: string;
  selectedForRefine: boolean;
};

export type RefinedSvgCandidate = SvgCandidate & {
  sourceDraftId?: string;
  strength?: string;
  concern?: string;
};

export type BackgroundVariation = {
  id: string;
  name: string;
  direction: string;
  svg: string;
  selected: boolean;
};

export type DemoComparisonRow = {
  name: string;
  role: string;
  layout: string;
  strength: string;
  concern: string;
  bestFor: string;
};

export type DemoComparison = {
  summary: string;
  primaryName: string;
  secondaryName: string;
  selectionReason: string;
  rows: DemoComparisonRow[];
};

export type FinalCandidate = {
  id: string;
  name: string;
  refinedCandidateId: string;
  selectedBackgroundId?: string;
  reason: string;
  editableLayers: string[];
  nextAdjustments: string[];
};

export type StageWorkflowData = {
  ideaDirections: IdeaDirection[];
  typographyDrafts: TypographyDraft[];
  refinedSvgCandidates: RefinedSvgCandidate[];
  demoComparison?: DemoComparison;
  backgroundVariations: BackgroundVariation[];
  finalCandidate?: FinalCandidate;
};
