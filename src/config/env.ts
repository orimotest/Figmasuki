import { apiSettings } from "./apiSettings";
import { getRuntimeApiSettings } from "./runtimeApiSettings";

export type ProviderEnv = {
  DIFY_INPUT_ORGANIZER_API_URL: string;
  DIFY_INPUT_ORGANIZER_API_KEY: string;
  DIFY_IDEAS_API_URL: string;
  DIFY_IDEAS_API_KEY: string;
  DIFY_DRAFT_SELECTION_API_URL: string;
  DIFY_DRAFT_SELECTION_API_KEY: string;
  DIFY_TYPOGRAPHY_DRAFT_API_URL: string;
  DIFY_TYPOGRAPHY_DRAFT_API_KEY: string;
  DIFY_REFINED_SELECTION_API_URL: string;
  DIFY_REFINED_SELECTION_API_KEY: string;
  DIFY_COPY_API_URL: string;
  DIFY_COPY_API_KEY: string;
  DIFY_LAYOUT_API_URL: string;
  DIFY_LAYOUT_API_KEY: string;
  DIFY_DIAGNOSIS_API_URL: string;
  DIFY_DIAGNOSIS_API_KEY: string;
  DIFY_COMPARE_API_URL: string;
  DIFY_COMPARE_API_KEY: string;
  GEMINI_API_KEY: string;
  GEMINI_TEXT_MODEL: string;
  GEMINI_IMAGE_MODEL: string;
  GEMINI_SVG_MODEL: string;
};

type OptionalDifyWorkflow = "ideas" | "draftSelection" | "typographyDraft" | "refinedSelection";
type ApiWorkflowSettings = { url: string; apiKey: string };

const difySettings = apiSettings.dify as typeof apiSettings.dify & Partial<Record<OptionalDifyWorkflow, ApiWorkflowSettings>>;

function readDifyWorkflow(workflow: OptionalDifyWorkflow): ApiWorkflowSettings {
  return difySettings[workflow] ?? { url: "", apiKey: "" };
}

export const env: ProviderEnv = {
  get DIFY_INPUT_ORGANIZER_API_URL() {
    return getRuntimeApiSettings().dify.inputOrganizer.url;
  },
  get DIFY_INPUT_ORGANIZER_API_KEY() {
    return getRuntimeApiSettings().dify.inputOrganizer.apiKey;
  },
  get DIFY_IDEAS_API_URL() {
    return getRuntimeApiSettings().dify.ideaExplorer.url || readDifyWorkflow("ideas").url;
  },
  get DIFY_IDEAS_API_KEY() {
    return getRuntimeApiSettings().dify.ideaExplorer.apiKey || readDifyWorkflow("ideas").apiKey;
  },
  get DIFY_DRAFT_SELECTION_API_URL() {
    return getRuntimeApiSettings().dify.candidateSelector.url || readDifyWorkflow("draftSelection").url;
  },
  get DIFY_DRAFT_SELECTION_API_KEY() {
    return getRuntimeApiSettings().dify.candidateSelector.apiKey || readDifyWorkflow("draftSelection").apiKey;
  },
  get DIFY_TYPOGRAPHY_DRAFT_API_URL() {
    return getRuntimeApiSettings().dify.typographyPlanner.url || readDifyWorkflow("typographyDraft").url;
  },
  get DIFY_TYPOGRAPHY_DRAFT_API_KEY() {
    return getRuntimeApiSettings().dify.typographyPlanner.apiKey || readDifyWorkflow("typographyDraft").apiKey;
  },
  get DIFY_REFINED_SELECTION_API_URL() {
    return getRuntimeApiSettings().dify.candidateSelector.url || readDifyWorkflow("refinedSelection").url;
  },
  get DIFY_REFINED_SELECTION_API_KEY() {
    return getRuntimeApiSettings().dify.candidateSelector.apiKey || readDifyWorkflow("refinedSelection").apiKey;
  },
  get DIFY_COPY_API_URL() {
    return getRuntimeApiSettings().dify.ideaExplorer.url || apiSettings.dify.copy.url;
  },
  get DIFY_COPY_API_KEY() {
    return getRuntimeApiSettings().dify.ideaExplorer.apiKey || apiSettings.dify.copy.apiKey;
  },
  get DIFY_LAYOUT_API_URL() {
    return getRuntimeApiSettings().dify.typographyPlanner.url || apiSettings.dify.layout.url;
  },
  get DIFY_LAYOUT_API_KEY() {
    return getRuntimeApiSettings().dify.typographyPlanner.apiKey || apiSettings.dify.layout.apiKey;
  },
  get DIFY_DIAGNOSIS_API_URL() {
    return getRuntimeApiSettings().dify.diagnosis.url || apiSettings.dify.diagnosis.url;
  },
  get DIFY_DIAGNOSIS_API_KEY() {
    return getRuntimeApiSettings().dify.diagnosis.apiKey || apiSettings.dify.diagnosis.apiKey;
  },
  get DIFY_COMPARE_API_URL() {
    return getRuntimeApiSettings().dify.compare.url || apiSettings.dify.compare.url;
  },
  get DIFY_COMPARE_API_KEY() {
    return getRuntimeApiSettings().dify.compare.apiKey || apiSettings.dify.compare.apiKey;
  },
  get GEMINI_API_KEY() {
    return getRuntimeApiSettings().gemini.apiKey || apiSettings.gemini.apiKey;
  },
  get GEMINI_TEXT_MODEL() {
    return getRuntimeApiSettings().gemini.textModel || apiSettings.gemini.textModel;
  },
  get GEMINI_IMAGE_MODEL() {
    return getRuntimeApiSettings().gemini.imageModel || apiSettings.gemini.imageModel;
  },
  get GEMINI_SVG_MODEL() {
    return getRuntimeApiSettings().gemini.svgModel || (apiSettings.gemini as typeof apiSettings.gemini & { svgModel?: string }).svgModel || apiSettings.gemini.textModel;
  },
};

export function assertConfigured(label: string, values: Record<string, string>): void {
  const missing = Object.entries(values)
    .filter(([, value]) => value.trim().length === 0)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`${label} is not configured: ${missing.join(", ")}. API設定を確認してください。`);
  }
}
