import { env } from "../../config/env";
import type { ExploreInput, NormalizedCreativeInput } from "../../schemas/input";
import { normalizeCreativeInput } from "../../workflows/inputNormalizeWorkflow";
import { isRecord } from "../../utils/guards";
import { callDifyWorkflow } from "./difyClient";

export async function organizeInputWithDify(input: ExploreInput): Promise<NormalizedCreativeInput> {
  const fallback = await normalizeCreativeInput(input);
  const output = await callDifyWorkflow<Record<string, unknown>, unknown>({
    url: env.DIFY_INPUT_ORGANIZER_API_URL,
    apiKey: env.DIFY_INPUT_ORGANIZER_API_KEY,
    inputs: {
      ...input,
      canvasSize: fallback.canvasSize,
      safeArea: fallback.safeArea,
    },
  });

  return normalizeOrganizerOutput(output, fallback);
}

function normalizeOrganizerOutput(value: unknown, fallback: NormalizedCreativeInput): NormalizedCreativeInput {
  if (!isRecord(value)) return fallback;
  return {
    ...fallback,
    inputSource: typeof value.inputSource === "string" ? (value.inputSource as NormalizedCreativeInput["inputSource"]) : fallback.inputSource,
    projectName: typeof value.projectName === "string" && value.projectName.trim() ? value.projectName : fallback.projectName,
    goal: typeof value.goal === "string" ? value.goal : fallback.goal,
    target: typeof value.target === "string" ? value.target : fallback.target,
    tone: typeof value.tone === "string" ? value.tone : fallback.tone,
    requiredInfo: Array.isArray(value.requiredInfo) ? value.requiredInfo.filter((item): item is string => typeof item === "string") : fallback.requiredInfo,
    missingInfo: Array.isArray(value.missingInfo) ? value.missingInfo.filter((item): item is string => typeof item === "string") : fallback.missingInfo,
    assumptions: Array.isArray(value.assumptions) ? value.assumptions.filter((item): item is string => typeof item === "string") : fallback.assumptions,
  };
}
