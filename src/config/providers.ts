import type { ProviderConfig } from "../schemas/provider";

export const providerConfig = {
  copy: "demo",
  layout: "demo",
  svg: "demo",
  diagnosis: "demo",
  compare: "demo",
  background: "demo",
  fallbackToDemo: false,
} as const satisfies ProviderConfig;
