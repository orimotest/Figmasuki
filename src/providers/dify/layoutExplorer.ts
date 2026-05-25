import { CANVAS_SIZE } from "../../config/canvas";
import { env } from "../../config/env";
import type { ExploreInput } from "../../schemas/input";
import type { ExploreResult } from "../../schemas/svg";
import { callDifyWorkflow } from "./difyClient";
import { normalizeDirections } from "./copyExplorer";

export async function exploreLayoutWithDify(input: ExploreInput): Promise<ExploreResult> {
  const output = await callDifyWorkflow<Record<string, unknown>, unknown>({
    url: env.DIFY_LAYOUT_API_URL,
    apiKey: env.DIFY_LAYOUT_API_KEY,
    inputs: {
      contentType: input.contentType,
      inputMode: input.inputMode,
      canvasSize: CANVAS_SIZE,
      safeArea: CANVAS_SIZE.safeArea,
      briefText: input.briefText ?? "",
      fixedCopy: input.fixedCopy ?? null,
    },
  });

  const directions = normalizeDirections(output).slice(0, 5);
  if (directions.length === 0) {
    throw new Error("Dify layout provider returned no directions.");
  }

  return {
    contentType: input.contentType,
    inputMode: input.inputMode,
    canvasSize: CANVAS_SIZE,
    exploredCount: 30,
    selectedCount: 5,
    input,
    directions,
    providerMeta: {
      provider: "dify",
      fallbackUsed: false,
    },
  };
}
