import { assertConfigured, env } from "../../config/env";
import { isRecord } from "../../utils/guards";

export type GeminiTextRequest = {
  model?: string;
  prompt: string;
  temperature?: number;
  timeoutMs?: number;
};

export async function callGeminiText({
  model = env.GEMINI_TEXT_MODEL,
  prompt,
  temperature = 0.6,
  timeoutMs = 60_000,
}: GeminiTextRequest): Promise<string> {
  assertConfigured("Gemini text provider", { GEMINI_API_KEY: env.GEMINI_API_KEY, model });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature,
        },
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Gemini generateContent failed with ${response.status}: ${stripSensitiveText(text)}`);
    }

    return extractGeminiText(JSON.parse(text));
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Gemini generateContent timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function extractGeminiText(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.candidates)) {
    throw new Error("Gemini response did not include candidates.");
  }

  const parts = value.candidates.flatMap((candidate) => {
    if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) return [];
    return candidate.content.parts;
  });

  const text = parts
    .map((part) => (isRecord(part) && typeof part.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Gemini response did not contain text output.");
  }

  return text;
}

function stripSensitiveText(text: string): string {
  return text.replace(env.GEMINI_API_KEY, "[redacted]").slice(0, 600);
}
