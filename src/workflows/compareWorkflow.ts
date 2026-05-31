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
  return normalizeComparisonFrameIds(await compare(frames, contentType, frameSummaries), frames);
}

function normalizeComparisonFrameIds(result: ComparisonResult, frames: FigmaFrameData[]): ComparisonResult {
  const frameIds = new Set(frames.map((frame) => frame.id));
  const fallbackPrimary = frames[0]?.id ?? result.recommendation.primaryFrameId;
  const fallbackSecondary = frames.find((frame) => frame.id !== fallbackPrimary)?.id;
  const primaryFrameId = frameIds.has(result.recommendation.primaryFrameId) ? result.recommendation.primaryFrameId : fallbackPrimary;
  const secondaryFrameId =
    result.recommendation.secondaryFrameId && frameIds.has(result.recommendation.secondaryFrameId)
      ? result.recommendation.secondaryFrameId
      : fallbackSecondary;
  const targetFrame = frames.find((frame) => frame.id === primaryFrameId) ?? frames[0];

  return {
    ...result,
    primaryFrameId,
    secondaryFrameIds: secondaryFrameId ? [secondaryFrameId] : [],
    recommendation: {
      ...result.recommendation,
      primaryFrameId,
      secondaryFrameId,
    },
    backgroundBrief: {
      ...result.backgroundBrief,
      targetFrameId: frameIds.has(result.backgroundBrief.targetFrameId) ? result.backgroundBrief.targetFrameId : primaryFrameId,
      targetFrameName: targetFrame?.name ?? result.backgroundBrief.targetFrameName,
      frameId: frameIds.has(result.backgroundBrief.frameId ?? "") ? result.backgroundBrief.frameId : primaryFrameId,
    },
  };
}
