import type { ContentType } from "./content";
import type { Severity } from "./common";
import type { FigmaFrameData, FigmaFrameDerivedData } from "./figmaFrame";
import type { ProviderMeta } from "./provider";

export type RuleCheckStatus = "pass" | "warn" | "fail";

export type RuleCheckResult = {
  id: string;
  label: string;
  status: RuleCheckStatus;
  severity: Severity;
  message: string;
  value?: string | number | boolean | null;
  target?: string;
};

export type RuleCheckReport = {
  id: string;
  contentType: ContentType;
  frameId: string;
  frameName: string;
  metrics: FigmaFrameDerivedData;
  checks: RuleCheckResult[];
  createdAt: string;
};

export type FixPriorityItem = {
  target: string;
  issue: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
};

export type RewriteInstruction = {
  label: string;
  instruction: string;
  targetWorkflow: "explore" | "generate_svg" | "finish";
};

export type DiagnosisResult = {
  id: string;
  frameId: string;
  frameName: string;
  frame: FigmaFrameData;
  contentType: ContentType;
  summary: string;
  firstImpression: string;
  strengths: string[];
  concerns: string[];
  fixPriority: FixPriorityItem[];
  rewriteInstructions: RewriteInstruction[];
  ruleCheck: RuleCheckReport;
  needVisualReview: boolean;
  createdAt: string;
  providerMeta?: ProviderMeta;
};
