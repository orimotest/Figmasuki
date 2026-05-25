import { diagnose } from "../providers";
import type { ContentType } from "../schemas/content";
import type { DiagnosisResult } from "../schemas/diagnosis";
import type { FigmaFrameData } from "../schemas/figmaFrame";
import { runRuleChecks } from "../utils/ruleChecks";

export async function runDiagnoseWorkflow(frame: FigmaFrameData, contentType: ContentType): Promise<DiagnosisResult> {
  const ruleCheck = runRuleChecks(frame, contentType);
  return diagnose(frame, contentType, ruleCheck);
}
