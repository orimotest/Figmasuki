import type { ContentType } from "./content";

export type InputMode = "brief_text" | "fixed_copy" | "pdf" | "figma_variation";

export type FixedCopyInput = {
  main: string;
  sub: string;
  cta?: string;
};

export type ExploreInput = {
  contentType: ContentType;
  inputMode: InputMode;
  briefText?: string;
  fixedCopy?: FixedCopyInput;
  rawInput?: string;
  targetAudience?: string;
  tone?: string;
};
