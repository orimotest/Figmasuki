import { CANVAS_SIZE } from "../../config/canvas";
import { env } from "../../config/env";
import type { Direction } from "../../schemas/direction";
import type { ExploreInput } from "../../schemas/input";
import { isRecord } from "../../utils/guards";
import { callDifyWorkflow } from "./difyClient";

export type CopyExploreOutput = {
  directions: Direction[];
};

export async function exploreCopyWithDify(input: ExploreInput): Promise<CopyExploreOutput> {
  const output = await callDifyWorkflow<Record<string, unknown>, unknown>({
    url: env.DIFY_COPY_API_URL,
    apiKey: env.DIFY_COPY_API_KEY,
    inputs: {
      contentType: input.contentType,
      inputMode: input.inputMode,
      canvasSize: CANVAS_SIZE,
      safeArea: CANVAS_SIZE.safeArea,
      briefText: input.briefText ?? "",
      fixedCopy: input.fixedCopy ?? null,
    },
  });

  return { directions: normalizeDirections(output).slice(0, 5) };
}

export function normalizeDirections(value: unknown): Direction[] {
  const rawDirections = isRecord(value) && Array.isArray(value.directions) ? value.directions : Array.isArray(value) ? value : [];
  return rawDirections.filter(isDirectionLike).map((item, index) => ({
    ...item,
    id: item.id || `dify_direction_${index + 1}`,
    name: item.name ?? item.title,
    title: item.title ?? item.name ?? `Direction ${index + 1}`,
    riskNote: item.riskNote ?? item.risk ?? "Live provider returned no risk note.",
  }));
}

function isDirectionLike(value: unknown): value is Direction & { risk?: string } {
  return (
    isRecord(value) &&
    typeof value.contentType === "string" &&
    typeof value.summary === "string" &&
    typeof value.intent === "string" &&
    typeof value.layoutType === "string" &&
    Array.isArray(value.tone) &&
    isRecord(value.copy) &&
    isRecord(value.layoutBrief) &&
    isRecord(value.styleBrief)
  );
}
