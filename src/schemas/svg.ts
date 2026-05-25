import type { ContentType } from "./content";
import type { Direction } from "./direction";
import type { ExploreInput } from "./input";
import type { CanvasSize } from "./canvas";
import type { ProviderMeta } from "./provider";

export type SvgValidationResult = {
  valid: boolean;
  warnings: string[];
  checks: {
    nonEmpty: boolean;
    hasSvgTag: boolean;
    hasClosingSvgTag: boolean;
    hasViewBox: boolean;
    hasWidth: boolean;
    hasHeight: boolean;
    hasText: boolean;
    noScript: boolean;
    noForeignObject: boolean;
    noExternalImage: boolean;
    lengthInRange: boolean;
  };
  errors: string[];
};

export type SvgCandidate = {
  id: string;
  directionId: string;
  contentType: ContentType;
  name: string;
  svg: string;
  width: 800;
  height: 450;
  validation: SvgValidationResult;
  meta: {
    layoutType: string;
    provider: "demo" | "gemini";
    fallbackUsed?: boolean;
    fallbackReason?: string;
    generatedAt: string;
  };
  previewLabel?: string;
  createdAt?: string;
};

export type ExploreResult = {
  contentType: ContentType;
  inputMode: ExploreInput["inputMode"];
  canvasSize: CanvasSize;
  exploredCount: 30;
  selectedCount: 5;
  input: ExploreInput;
  directions: Direction[];
  providerMeta?: ProviderMeta;
};

export type SvgGenerationResult = {
  svgs: SvgCandidate[];
};
