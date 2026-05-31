import { env } from "../../config/env";
import type { ContentType } from "../../schemas/content";
import type { DiagnosisResult, RuleCheckReport } from "../../schemas/diagnosis";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import { isRecord } from "../../utils/guards";
import { callDifyWorkflow } from "./difyClient";
import { demoIdealTemplateContract, difyCommonContract } from "./difyPromptContracts";

export async function diagnoseWithDify(
  frame: FigmaFrameData,
  contentType: ContentType,
  ruleCheck?: RuleCheckReport,
): Promise<DiagnosisResult> {
  const output = await callDifyWorkflow<Record<string, unknown>, unknown>({
    url: env.DIFY_DIAGNOSIS_API_URL,
    apiKey: env.DIFY_DIAGNOSIS_API_KEY,
    inputs: {
      contract: difyCommonContract,
      idealTemplateReference: demoIdealTemplateContract,
      contentType,
      frame: compactFrame(frame),
      ruleCheck,
      instruction: "Do not score, predict CTR, or declare a winning design.",
    },
  });

  if (!isDiagnosisPartial(output)) {
    throw new Error("Dify diagnosis response did not match DiagnosisResult fields.");
  }

  return {
    ...output,
    id: output.id ?? `diagnosis_dify_${frame.id}`,
    contentType,
    frameId: frame.id,
    frameName: frame.name,
    frame,
    ruleCheck: ruleCheck ?? output.ruleCheck,
    createdAt: output.createdAt ?? new Date().toISOString(),
    providerMeta: { provider: "dify", fallbackUsed: false },
  } as DiagnosisResult;
}

function compactFrame(frame: FigmaFrameData): Record<string, unknown> {
  return {
    id: frame.id,
    name: frame.name,
    width: frame.width,
    height: frame.height,
    derived: frame.derived,
    textNodes: frame.textNodes.map((node) => ({
      name: node.name,
      characters: node.characters,
      fontSize: node.fontSize,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    })),
  };
}

function isDiagnosisPartial(value: unknown): value is Partial<DiagnosisResult> & Pick<DiagnosisResult, "summary" | "firstImpression" | "strengths" | "concerns" | "fixPriority" | "rewriteInstructions" | "needVisualReview"> {
  return (
    isRecord(value) &&
    typeof value.summary === "string" &&
    typeof value.firstImpression === "string" &&
    Array.isArray(value.strengths) &&
    Array.isArray(value.concerns) &&
    Array.isArray(value.fixPriority) &&
    Array.isArray(value.rewriteInstructions) &&
    typeof value.needVisualReview === "boolean"
  );
}
