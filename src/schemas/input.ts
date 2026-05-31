import type { ContentType } from "./content";
import type { CanvasSize } from "./canvas";

export type InputSource = "minimal_prompt" | "brief_text" | "fixed_copy" | "pdf" | "markdown" | "figma_reference";
export type InputMode = InputSource | "figma_variation";

export type RequirementBlockType = "heading" | "paragraph" | "list" | "ordered_list" | "quote" | "code" | "table";

export type RequirementBlock = {
  id: string;
  type: RequirementBlockType;
  text: string;
  level?: 1 | 2 | 3;
  items?: string[];
  rows?: string[][];
};

export type FixedCopyInput = {
  main: string;
  sub: string;
  cta?: string;
  date?: string;
  time?: string;
  location?: string;
};

export type ExploreInput = {
  contentType: ContentType;
  inputMode: InputMode;
  briefText?: string;
  fixedCopy?: FixedCopyInput;
  rawInput?: string;
  targetAudience?: string;
  tone?: string;
  projectName?: string;
  goal?: string;
  pdfText?: string;
  pdfFileName?: string;
  markdownText?: string;
  requirementBlocks?: RequirementBlock[];
  referenceFrameSummary?: string;
  assumptions?: string[];
};

export type NormalizedCreativeInput = {
  inputSource: InputSource;
  contentType: ContentType;
  canvasSize: CanvasSize;
  safeArea: { x: 48; y: 40; width: 704; height: 370 };
  projectName: string;
  goal?: string;
  target?: string;
  tone?: string;
  requiredInfo: string[];
  missingInfo: string[];
  fixedCopy?: FixedCopyInput;
  briefText?: string;
  pdfText?: string;
  pdfFileName?: string;
  markdownText?: string;
  requirementBlocks?: RequirementBlock[];
  referenceFrameSummary?: string;
  assumptions: string[];
};
