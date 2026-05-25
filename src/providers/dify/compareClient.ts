import { env } from "../../config/env";
import type { ContentType } from "../../schemas/content";
import type { ComparisonResult, FrameCompareSummary } from "../../schemas/comparison";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import { isRecord } from "../../utils/guards";
import { callDifyWorkflow } from "./difyClient";

export async function compareWithDify(
  frames: FigmaFrameData[],
  contentType: ContentType,
  frameSummaries?: FrameCompareSummary[],
): Promise<ComparisonResult> {
  const output = await callDifyWorkflow<Record<string, unknown>, unknown>({
    url: env.DIFY_COMPARE_API_URL,
    apiKey: env.DIFY_COMPARE_API_KEY,
    inputs: {
      contentType,
      frames: frames.map((frame) => ({
        id: frame.id,
        name: frame.name,
        width: frame.width,
        height: frame.height,
        derived: frame.derived,
      })),
      frameSummaries,
      instruction: "Use primary/secondary language, not winning/score/CVR predictions.",
    },
  });

  if (!isComparisonPartial(output)) {
    throw new Error("Dify compare response did not match ComparisonResult fields.");
  }

  return {
    ...output,
    id: output.id ?? `comparison_dify_${Date.now().toString(36)}`,
    contentType,
    frames,
    frameSummaries: frameSummaries ?? output.frameSummaries,
    createdAt: output.createdAt ?? new Date().toISOString(),
    providerMeta: { provider: "dify", fallbackUsed: false },
  } as ComparisonResult;
}

function isComparisonPartial(value: unknown): value is Partial<ComparisonResult> & Pick<ComparisonResult, "comparisonSummary" | "frameRoles" | "recommendation" | "backgroundBrief" | "nextActions"> {
  return (
    isRecord(value) &&
    typeof value.comparisonSummary === "string" &&
    Array.isArray(value.frameRoles) &&
    isRecord(value.recommendation) &&
    isRecord(value.backgroundBrief) &&
    Array.isArray(value.nextActions)
  );
}
