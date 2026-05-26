import { apiSettings } from "./apiSettings";
import { emptyRuntimeApiSettings, type RuntimeApiSettings } from "../schemas/apiSettings";

export const RUNTIME_API_SETTINGS_STORAGE_KEY = "ai-cover-studio-runtime-api-settings";

export function getRuntimeApiSettings(): RuntimeApiSettings {
  return mergeRuntimeSettings(readLocalSettings(), readFileSettings());
}

export function saveRuntimeApiSettings(settings: RuntimeApiSettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(RUNTIME_API_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

export function maskSecret(value: string): string {
  if (!value) return "未設定";
  return value.length <= 4 ? "****" : `****${value.slice(-4)}`;
}

function readLocalSettings(): Partial<RuntimeApiSettings> | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem(RUNTIME_API_SETTINGS_STORAGE_KEY);
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Partial<RuntimeApiSettings>;
  } catch {
    return undefined;
  }
}

function readFileSettings(): RuntimeApiSettings {
  const dify = apiSettings.dify as typeof apiSettings.dify & Record<string, { url?: string; apiKey?: string } | undefined>;
  return {
    dify: {
      inputOrganizer: toCredential(dify.inputOrganizer ?? dify.copy),
      ideaExplorer: toCredential(dify.ideaExplorer ?? dify.ideas ?? dify.copy),
      typographyPlanner: toCredential(dify.typographyPlanner ?? dify.typographyDraft ?? dify.layout),
      candidateSelector: toCredential(dify.candidateSelector ?? dify.refinedSelection ?? dify.layout),
      diagnosis: toCredential(dify.diagnosis),
      compare: toCredential(dify.compare),
    },
    gemini: {
      apiKey: apiSettings.gemini.apiKey,
      textModel: apiSettings.gemini.textModel,
      imageModel: apiSettings.gemini.imageModel,
      svgModel: (apiSettings.gemini as typeof apiSettings.gemini & { svgModel?: string }).svgModel ?? apiSettings.gemini.textModel,
    },
  };
}

function toCredential(value?: { url?: string; apiKey?: string }): { url: string; apiKey: string } {
  return { url: value?.url ?? "", apiKey: value?.apiKey ?? "" };
}

function mergeRuntimeSettings(primary: Partial<RuntimeApiSettings> | undefined, fallback: RuntimeApiSettings): RuntimeApiSettings {
  return {
    dify: {
      inputOrganizer: mergeCredential(primary?.dify?.inputOrganizer, fallback.dify.inputOrganizer),
      ideaExplorer: mergeCredential(primary?.dify?.ideaExplorer, fallback.dify.ideaExplorer),
      typographyPlanner: mergeCredential(primary?.dify?.typographyPlanner, fallback.dify.typographyPlanner),
      candidateSelector: mergeCredential(primary?.dify?.candidateSelector, fallback.dify.candidateSelector),
      diagnosis: mergeCredential(primary?.dify?.diagnosis, fallback.dify.diagnosis),
      compare: mergeCredential(primary?.dify?.compare, fallback.dify.compare),
    },
    gemini: {
      apiKey: primary?.gemini?.apiKey || fallback.gemini.apiKey || emptyRuntimeApiSettings.gemini.apiKey,
      textModel: primary?.gemini?.textModel || fallback.gemini.textModel || emptyRuntimeApiSettings.gemini.textModel,
      imageModel: primary?.gemini?.imageModel || fallback.gemini.imageModel || emptyRuntimeApiSettings.gemini.imageModel,
      svgModel: primary?.gemini?.svgModel || fallback.gemini.svgModel || emptyRuntimeApiSettings.gemini.svgModel,
    },
  };
}

function mergeCredential(primary: { url?: string; apiKey?: string } | undefined, fallback: { url: string; apiKey: string }): { url: string; apiKey: string } {
  return {
    url: primary?.url || fallback.url,
    apiKey: primary?.apiKey || fallback.apiKey,
  };
}
