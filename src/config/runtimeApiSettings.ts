import { apiSettings } from "./apiSettings";
import type { RuntimeApiSettings } from "../schemas/apiSettings";

export const RUNTIME_API_SETTINGS_CHANGED_EVENT = "RUNTIME_API_SETTINGS_CHANGED";

export function getRuntimeApiSettings(): RuntimeApiSettings {
  return readFileSettings();
}

export function notifyRuntimeApiSettingsChanged(settings = getRuntimeApiSettings()): void {
  if (typeof window === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent(RUNTIME_API_SETTINGS_CHANGED_EVENT, { detail: settings }));
  } catch {
    window.dispatchEvent(new Event(RUNTIME_API_SETTINGS_CHANGED_EVENT));
  }
}

export function isRuntimeApiMode(settings = getRuntimeApiSettings()): boolean {
  return settings.mode === "api";
}

export function isRuntimeLiveReady(settings = getRuntimeApiSettings()): boolean {
  return isRuntimeApiMode(settings) && isRuntimeApiConfigured(settings);
}

export function isRuntimeApiConfigured(settings = getRuntimeApiSettings()): boolean {
  return hasAnyDifyWorkflow(settings) || settings.gemini.apiKey.trim().length > 0;
}

export function getRuntimeExecutionModeLabel(settings = getRuntimeApiSettings()): "API" | "Demo" {
  return isRuntimeLiveReady(settings) ? "API" : "Demo";
}

export function hasDifyWorkflowSettings(workflow: keyof RuntimeApiSettings["dify"], settings = getRuntimeApiSettings()): boolean {
  if (!isRuntimeApiMode(settings)) return false;
  const target = settings.dify[workflow];
  return target.url.trim().length > 0 && target.apiKey.trim().length > 0;
}

export function hasGeminiSettings(settings = getRuntimeApiSettings()): boolean {
  if (!isRuntimeApiMode(settings)) return false;
  return settings.gemini.apiKey.trim().length > 0;
}

export function isGeminiOnlyApiMode(settings = getRuntimeApiSettings()): boolean {
  return isRuntimeApiMode(settings) && settings.gemini.apiKey.trim().length > 0 && !hasAnyDifyWorkflow(settings);
}

function hasAnyDifyWorkflow(settings: RuntimeApiSettings): boolean {
  return Object.values(settings.dify).some((workflow) => workflow.url.trim() && workflow.apiKey.trim());
}

function readFileSettings(): RuntimeApiSettings {
  const dify = apiSettings.dify as typeof apiSettings.dify & Record<string, { url?: string; apiKey?: string } | undefined>;
  const fileSettings = {
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
  const hasFileApi = Object.values(fileSettings.dify).some((workflow) => workflow.url.trim() && workflow.apiKey.trim()) || fileSettings.gemini.apiKey.trim().length > 0;
  return {
    mode: hasFileApi ? "api" : "demo",
    dify: {
      ...fileSettings.dify,
    },
    gemini: {
      ...fileSettings.gemini,
    },
  };
}

function toCredential(value?: { url?: string; apiKey?: string }): { url: string; apiKey: string } {
  return { url: value?.url ?? "", apiKey: value?.apiKey ?? "" };
}
