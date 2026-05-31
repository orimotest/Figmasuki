import { env } from "../../config/env";
import type { LayoutDraftInput } from "../../schemas/layoutDraft";
import { isRecord } from "../../utils/guards";
import { callDifyWorkflow } from "./difyClient";
import { candidateSelectionContract, demoIdealTemplateContract, difyCommonContract } from "./difyPromptContracts";

export type CandidateSelection = {
  draftId: string;
  reason: string;
  designDirection: string;
};

export async function selectCandidatesWithDify(drafts: LayoutDraftInput[]): Promise<CandidateSelection[]> {
  const output = await callDifyWorkflow<Record<string, unknown>, unknown>({
    url: env.DIFY_REFINED_SELECTION_API_URL,
    apiKey: env.DIFY_REFINED_SELECTION_API_KEY,
    inputs: {
      contract: difyCommonContract,
      outputSchema: candidateSelectionContract,
      idealTemplateReference: demoIdealTemplateContract,
      drafts,
      instruction: "Select five visually distinct candidates for Gemini SVG refine.",
    },
  });

  const raw = isRecord(output) && Array.isArray(output.selected) ? output.selected : Array.isArray(output) ? output : [];
  const selected = raw.map(normalizeSelection).filter(Boolean) as CandidateSelection[];
  if (selected.length > 0) return selected.slice(0, 5);

  return drafts.slice(0, 5).map((draft) => ({
    draftId: draft.id,
    reason: draft.evaluationMemo ?? "方向性の違いを残すため",
    designDirection: `${draft.directionName} / ${draft.layoutType}`,
  }));
}

function normalizeSelection(value: unknown): CandidateSelection | null {
  if (!isRecord(value) || typeof value.draftId !== "string") return null;
  return {
    draftId: value.draftId,
    reason: typeof value.reason === "string" ? value.reason : "比較対象として残すため",
    designDirection: typeof value.designDirection === "string" ? value.designDirection : "layout direction",
  };
}
