import { apiSettings } from "./apiSettings";

export type ProviderEnv = {
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
};

export const env: ProviderEnv = {
  DIFY_COPY_API_URL: apiSettings.dify.copy.url,
  DIFY_COPY_API_KEY: apiSettings.dify.copy.apiKey,
  DIFY_LAYOUT_API_URL: apiSettings.dify.layout.url,
  DIFY_LAYOUT_API_KEY: apiSettings.dify.layout.apiKey,
  DIFY_DIAGNOSIS_API_URL: apiSettings.dify.diagnosis.url,
  DIFY_DIAGNOSIS_API_KEY: apiSettings.dify.diagnosis.apiKey,
  DIFY_COMPARE_API_URL: apiSettings.dify.compare.url,
  DIFY_COMPARE_API_KEY: apiSettings.dify.compare.apiKey,
  GEMINI_API_KEY: apiSettings.gemini.apiKey,
  GEMINI_TEXT_MODEL: apiSettings.gemini.textModel,
  GEMINI_IMAGE_MODEL: apiSettings.gemini.imageModel,
};

export function assertConfigured(label: string, values: Record<string, string>): void {
  const missing = Object.entries(values)
    .filter(([, value]) => value.trim().length === 0)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`${label} is not configured: ${missing.join(", ")}. src/config/apiSettings.ts を確認してください。`);
  }
}
