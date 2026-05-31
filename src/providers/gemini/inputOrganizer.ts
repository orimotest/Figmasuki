import { CANVAS_SIZE } from "../../config/canvas";
import type { ExploreInput, NormalizedCreativeInput } from "../../schemas/input";
import { isRecord } from "../../utils/guards";
import { callGeminiText } from "./geminiClient";

export async function organizeInputWithGemini(input: ExploreInput, fallback: NormalizedCreativeInput): Promise<NormalizedCreativeInput> {
  const text = await callGeminiText({
    prompt: buildOrganizerPrompt(input, fallback),
    temperature: 0.25,
    timeoutMs: 45_000,
  });
  return normalizeOrganizerOutput(parseJsonObject(text), fallback);
}

function buildOrganizerPrompt(input: ExploreInput, fallback: NormalizedCreativeInput): string {
  return `You are an assistant inside a Figma plugin. Normalize the Japanese creative requirements into JSON only.
Do not include markdown fences. Keep values concise and useful for banner generation.

Required JSON keys:
{
  "projectName": string,
  "goal": string,
  "target": string,
  "tone": string,
  "requiredInfo": string[],
  "missingInfo": string[],
  "assumptions": string[]
}

Canvas:
${JSON.stringify({ canvasSize: CANVAS_SIZE, safeArea: fallback.safeArea })}

Input:
${JSON.stringify(input, null, 2)}`;
}

function normalizeOrganizerOutput(value: unknown, fallback: NormalizedCreativeInput): NormalizedCreativeInput {
  if (!isRecord(value)) return fallback;
  return {
    ...fallback,
    projectName: readString(value.projectName, fallback.projectName) ?? fallback.projectName,
    goal: readString(value.goal, fallback.goal),
    target: readString(value.target, fallback.target),
    tone: readString(value.tone, fallback.tone),
    requiredInfo: readStringArray(value.requiredInfo, fallback.requiredInfo),
    missingInfo: readStringArray(value.missingInfo, fallback.missingInfo),
    assumptions: readStringArray(value.assumptions, fallback.assumptions),
  };
}

function readString(value: unknown, fallback: string | undefined): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  return items.length > 0 ? items : fallback;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const normalized = fenced?.[1] ?? trimmed.slice(Math.max(0, trimmed.indexOf("{")), trimmed.lastIndexOf("}") + 1);
  return JSON.parse(normalized);
}
