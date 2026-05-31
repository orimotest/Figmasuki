import { CANVAS_SIZE } from "../../config/canvas";
import type { Direction } from "../../schemas/direction";
import type { ExploreInput } from "../../schemas/input";
import type { ExploreResult } from "../../schemas/svg";
import { normalizeDirections } from "../dify/copyExplorer";
import { callGeminiText } from "./geminiClient";

export async function exploreWithGemini(input: ExploreInput): Promise<ExploreResult> {
  const text = await callGeminiText({
    prompt: buildExplorePrompt(input),
    temperature: 0.55,
    timeoutMs: 60_000,
  });
  const directions = normalizeDirections(parseJsonObject(text), input.contentType).slice(0, 5);
  if (directions.length < 5) {
    throw new Error(`Gemini idea explorer returned ${directions.length}/5 directions.`);
  }
  return {
    contentType: input.contentType,
    inputMode: input.inputMode,
    canvasSize: CANVAS_SIZE,
    exploredCount: 30,
    selectedCount: 5,
    input,
    directions: directions.map((direction, index) => ({
      ...direction,
      id: direction.id || `gemini_direction_${index + 1}`,
      contentType: input.contentType,
    })) as Direction[],
    providerMeta: {
      provider: "gemini",
      fallbackUsed: false,
    },
  };
}

function buildExplorePrompt(input: ExploreInput): string {
  return `You are a senior creative director for Japanese Figma banner production.
Generate exactly 5 selected directions from a broader 30-idea exploration. Return JSON only, no markdown.

Output schema:
{
  "directions": [
    {
      "id": "gemini_direction_01",
      "contentType": "${input.contentType}",
      "title": string,
      "summary": string,
      "intent": string,
      "layoutType": "problem_to_cta" | "benefit_first" | "practical_blocks" | "trust_editorial" | "beginner_friendly",
      "tone": string[],
      "copy": {
        "main": string,
        "sub": string,
        "headline": string,
        "subheadline": string,
        "cta": string
      },
      "layoutBrief": {
        "id": string,
        "contentType": "${input.contentType}",
        "title": string,
        "description": string,
        "composition": string,
        "hierarchy": string[],
        "constraints": string[]
      },
      "styleBrief": {
        "mood": string,
        "palette": string[],
        "typography": string,
        "visualMotifs": string[]
      },
      "rationale": string,
      "riskNote": string,
      "tags": string[]
    }
  ]
}

Requirements:
- Japanese copy.
- Avoid generic demo text. Use the provided input.
- CTA must fit a 800x450 banner.
- Main copy should be 1-2 short lines.

Input:
${JSON.stringify(input, null, 2)}`;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const source = fenced?.[1] ?? trimmed;
  const objectStart = source.indexOf("{");
  const objectEnd = source.lastIndexOf("}");
  if (objectStart < 0 || objectEnd <= objectStart) throw new Error("Gemini idea explorer did not return JSON.");
  return JSON.parse(source.slice(objectStart, objectEnd + 1));
}
