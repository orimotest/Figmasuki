import type { ContentType } from "./content";
import type { ProviderMeta } from "./provider";

export type BackgroundBrief = {
  id: string;
  contentType: ContentType;
  targetFrameId: string;
  targetFrameName: string;
  mood: string;
  style: string;
  avoid: string[];
  safeAreaHint: string;
  suggestedStyleKeywords: string[];
  promptText: string;
  frameId?: string;
  prompt?: string;
  negativePrompt?: string;
  styleNotes?: string[];
};

export type DemoBackgroundKind = "figma_shapes" | "svg_background" | "image";

export type BackgroundResult = {
  id: string;
  brief: BackgroundBrief;
  type: DemoBackgroundKind;
  colors: string[];
  styleName: string;
  svg?: string;
  base64?: string;
  imageBytes?: Uint8Array;
  imageUrl?: string;
  status: "stub" | "generated" | "failed";
  message?: string;
  createdAt: string;
  providerMeta?: ProviderMeta;
};
