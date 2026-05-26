import { assertConfigured } from "../../config/env";
import { isRecord } from "../../utils/guards";

export type DifyWorkflowRequest<TInput> = {
  url: string;
  apiKey: string;
  inputs: TInput;
  user?: string;
  timeoutMs?: number;
};

export async function callDifyWorkflow<TInput extends Record<string, unknown>, TOutput>({
  url,
  apiKey,
  inputs,
  user = "figma-plugin-local",
  timeoutMs = 45_000,
}: DifyWorkflowRequest<TInput>): Promise<TOutput> {
  assertConfigured("Dify workflow", { url, apiKey });

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        inputs,
        response_mode: "blocking",
        user,
      }),
      signal: controller.signal,
    });

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`Dify workflow failed with ${response.status}: ${stripSensitiveText(text)}`);
    }

    const json = parseJson(text, "Dify response");
    const payload = extractDifyPayload(json);
    return normalizeDifyOutput<TOutput>(payload);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(`Dify workflow timed out after ${timeoutMs}ms.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function extractDifyPayload(value: unknown): unknown {
  if (!isRecord(value)) return value;

  const data = value.data;
  if (isRecord(data)) {
    if ("outputs" in data) return data.outputs;
    if ("output" in data) return data.output;
  }

  if ("outputs" in value) return value.outputs;
  if ("output" in value) return value.output;
  if ("answer" in value) return value.answer;
  if ("text" in value) return value.text;
  return value;
}

function normalizeDifyOutput<TOutput>(payload: unknown): TOutput {
  if (typeof payload === "string") {
    return parseJson(payload, "Dify JSON string") as TOutput;
  }
  if (isRecord(payload)) {
    if (typeof payload.result === "string") return parseJson(payload.result, "Dify result string") as TOutput;
    if (typeof payload.json === "string") return parseJson(payload.json, "Dify json string") as TOutput;
    return payload as TOutput;
  }
  throw new Error("Dify response did not contain a JSON object payload.");
}

function parseJson(text: string, label: string): unknown {
  const normalized = extractJsonText(text);
  try {
    return JSON.parse(normalized);
  } catch {
    throw new Error(`${label} could not be parsed as JSON.`);
  }
}

function extractJsonText(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) return trimmed.slice(objectStart, objectEnd + 1);

  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  if (arrayStart >= 0 && arrayEnd > arrayStart) return trimmed.slice(arrayStart, arrayEnd + 1);

  return trimmed;
}

function stripSensitiveText(text: string): string {
  return text.replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]").slice(0, 600);
}
