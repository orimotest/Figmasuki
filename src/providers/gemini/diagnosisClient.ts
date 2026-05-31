import type { ContentType } from "../../schemas/content";
import type { DiagnosisResult, FixPriorityItem, RewriteInstruction, RuleCheckReport } from "../../schemas/diagnosis";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import { isRecord } from "../../utils/guards";
import { runRuleChecks } from "../../utils/ruleChecks";
import { callGeminiText } from "./geminiClient";

export async function diagnoseWithGemini(
  frame: FigmaFrameData,
  contentType: ContentType,
  ruleCheck: RuleCheckReport = runRuleChecks(frame, contentType),
): Promise<DiagnosisResult> {
  const output = await callGeminiText({
    prompt: buildDiagnosisPrompt(frame, contentType, ruleCheck),
    temperature: 0.35,
    timeoutMs: 45_000,
  });
  const parsed = parseJsonObject(output);

  return {
    id: `gemini_diagnosis_${frame.id}_${Date.now().toString(36)}`,
    frameId: frame.id,
    frameName: frame.name,
    frame,
    contentType,
    summary: readString(isRecord(parsed) ? parsed.summary : undefined, "生成案の情報設計を診断しました。"),
    firstImpression: readString(isRecord(parsed) ? parsed.firstImpression : undefined, "最初に主見出しが印象として残ります。"),
    strengths: readStringArray(isRecord(parsed) ? parsed.strengths : undefined, ["主題を伝える要素があります。"]),
    concerns: readStringArray(isRecord(parsed) ? parsed.concerns : undefined, ["余白と読み順の確認が必要です。"]),
    fixPriority: normalizeFixPriority(isRecord(parsed) ? parsed.fixPriority : undefined),
    rewriteInstructions: normalizeRewriteInstructions(isRecord(parsed) ? parsed.rewriteInstructions : undefined),
    ruleCheck,
    needVisualReview: ruleCheck.checks.some((check) => check.status !== "pass"),
    createdAt: new Date().toISOString(),
    providerMeta: {
      provider: "gemini",
      fallbackUsed: false,
    },
  };
}

function buildDiagnosisPrompt(frame: FigmaFrameData, contentType: ContentType, ruleCheck: RuleCheckReport): string {
  return `Return JSON only. Diagnose this Japanese Figma banner candidate.
Schema:
{
  "summary": string,
  "firstImpression": string,
  "strengths": string[],
  "concerns": string[],
  "fixPriority": [{"target": string, "issue": string, "suggestion": string, "priority": "high" | "medium" | "low"}],
  "rewriteInstructions": [{"label": string, "instruction": string, "targetWorkflow": "explore" | "generate_svg" | "finish"}]
}

Content type: ${contentType}
Frame:
${JSON.stringify({ id: frame.id, name: frame.name, text: frame.textNodes.map((node) => node.characters) }, null, 2)}
Rule check:
${JSON.stringify(ruleCheck, null, 2)}`;
}

function normalizeFixPriority(value: unknown): FixPriorityItem[] {
  if (!Array.isArray(value)) return [{ target: "Layout", issue: "読み順の確認", suggestion: "主見出し、補助情報、CTAの順で読めるように調整してください。", priority: "medium" }];
  return value.filter(isRecord).slice(0, 5).map((item) => ({
    target: readString(item.target, "Layout"),
    issue: readString(item.issue, "読み順の確認"),
    suggestion: readString(item.suggestion, "主見出し、補助情報、CTAの順で読めるように調整してください。"),
    priority: item.priority === "high" || item.priority === "low" ? item.priority : "medium",
  }));
}

function normalizeRewriteInstructions(value: unknown): RewriteInstruction[] {
  if (!Array.isArray(value)) return [{ label: "派生案を作る", instruction: "現在の強みを保ちながら、訴求軸だけを変えた派生案を作ります。", targetWorkflow: "explore" }];
  return value.filter(isRecord).slice(0, 4).map((item) => ({
    label: readString(item.label, "派生案を作る"),
    instruction: readString(item.instruction, "現在の強みを保ちながら、訴求軸だけを変えた派生案を作ります。"),
    targetWorkflow: item.targetWorkflow === "generate_svg" || item.targetWorkflow === "finish" ? item.targetWorkflow : "explore",
  }));
}

function readStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  return items.length > 0 ? items : fallback;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const source = fenced?.[1] ?? trimmed;
  const objectStart = source.indexOf("{");
  const objectEnd = source.lastIndexOf("}");
  if (objectStart < 0 || objectEnd <= objectStart) throw new Error("Gemini diagnosis did not return JSON.");
  return JSON.parse(source.slice(objectStart, objectEnd + 1));
}
