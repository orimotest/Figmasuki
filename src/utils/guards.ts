import { contentTypes, type ContentType } from "../schemas/content";
import type { ProviderMode } from "../schemas/provider";

const providerModes = ["demo", "dify", "gemini"] as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isContentType(value: unknown): value is ContentType {
  return typeof value === "string" && contentTypes.includes(value as ContentType);
}

export function isProviderMode(value: unknown): value is ProviderMode {
  return typeof value === "string" && providerModes.includes(value as ProviderMode);
}

export function hasString<Key extends string>(
  value: Record<string, unknown>,
  key: Key,
): value is Record<string, unknown> & Record<Key, string> {
  return typeof value[key] === "string";
}
