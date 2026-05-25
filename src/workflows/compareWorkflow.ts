import { compare } from "../providers";
import type { ContentType } from "../schemas/content";
import type { ComparisonResult, FrameCompareSummary } from "../schemas/comparison";
import type { FigmaFrameData } from "../schemas/figmaFrame";
import { runRuleChecks } from "../utils/ruleChecks";

export async function runCompareWorkflow(frames: FigmaFrameData[], contentType: ContentType): Promise<ComparisonResult> {
  if (frames.length < 2) {
    throw new Error("Compare requires at least two frames.");
  }
  const frameSummaries: FrameCompareSummary[] = frames.map((frame) => ({
    frame,
    ruleCheck: runRuleChecks(frame, contentType),
  }));
  return compare(frames, contentType, frameSummaries);
}
