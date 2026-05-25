import type { BackgroundBrief } from "./background";
import type { CanvasSize } from "./canvas";
import type { ContentType } from "./content";
import type { RuleCheckReport } from "./diagnosis";
import type { FigmaFrameData } from "./figmaFrame";
import type { ProviderMeta } from "./provider";

export type FrameRole = {
  frameId: string;
  frameName: string;
  role: string;
  bestFor: string;
  strength: string;
  risk: string;
  note: string;
};

export type ComparisonRecommendation = {
  primaryFrameId: string;
  primaryReason: string;
  secondaryFrameId?: string;
  secondaryReason?: string;
};

export type CompareNextAction = {
  label: string;
  action: "finish_background" | "revise_in_explore" | "manual_adjust";
  targetFrameId: string;
  instruction: string;
};

export type FrameCompareSummary = {
  frame: FigmaFrameData;
  ruleCheck: RuleCheckReport;
};

export type ComparisonResult = {
  id: string;
  contentType: ContentType;
  canvasSize: CanvasSize;
  frames: FigmaFrameData[];
  frameSummaries: FrameCompareSummary[];
  comparisonSummary: string;
  frameRoles: FrameRole[];
  recommendation: ComparisonRecommendation;
  backgroundBrief: BackgroundBrief;
  nextActions: CompareNextAction[];
  createdAt: string;
  primaryFrameId: string;
  secondaryFrameIds: string[];
  reasons: string[];
  providerMeta?: ProviderMeta;
};
