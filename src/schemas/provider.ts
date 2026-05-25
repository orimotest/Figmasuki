export type LanguageProviderMode = "demo" | "dify";
export type VisualProviderMode = "demo" | "gemini";
export type ProviderMode = LanguageProviderMode | VisualProviderMode;

export type ProviderMeta = {
  provider: ProviderMode;
  fallbackUsed: boolean;
  fallbackReason?: string;
};

export type ProviderConfig = {
  copy: LanguageProviderMode;
  layout: LanguageProviderMode;
  diagnosis: LanguageProviderMode;
  compare: LanguageProviderMode;
  svg: VisualProviderMode;
  background: VisualProviderMode;
  fallbackToDemo: boolean;
};
