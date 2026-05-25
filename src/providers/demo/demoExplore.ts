import { noteThumbnailDirectionsDemo, noteThumbnailInputDemo } from "../../data/demo/noteThumbnailDemo";
import { seminarBannerDirectionsDemo } from "../../data/demo/seminarBannerDemo";
import { CANVAS_SIZE } from "../../config/canvas";
import type { ContentType } from "../../schemas/content";
import type { Direction } from "../../schemas/direction";
import type { ExploreInput } from "../../schemas/input";
import type { ExploreResult } from "../../schemas/svg";

export async function demoExplore(input?: ExploreInput): Promise<ExploreResult> {
  const resolvedInput = input ?? noteThumbnailInputDemo;
  const directions = applyFixedCopy(getDemoDirections(resolvedInput.contentType), resolvedInput);
  return {
    contentType: resolvedInput.contentType,
    inputMode: resolvedInput.inputMode,
    canvasSize: CANVAS_SIZE,
    exploredCount: 30,
    selectedCount: 5,
    input: resolvedInput,
    directions,
    providerMeta: {
      provider: "demo",
      fallbackUsed: false,
    },
  };
}

function getDemoDirections(contentType: ContentType): Direction[] {
  if (contentType === "seminar_banner") {
    return seminarBannerDirectionsDemo;
  }
  return noteThumbnailDirectionsDemo;
}

function applyFixedCopy(directions: Direction[], input: ExploreInput): Direction[] {
  if (input.inputMode !== "fixed_copy" || !input.fixedCopy) {
    return directions;
  }

  return directions.map((direction) => ({
    ...direction,
    copy: {
      ...direction.copy,
      main: input.fixedCopy?.main ?? direction.copy.main,
      sub: input.fixedCopy?.sub ?? direction.copy.sub,
      cta: input.fixedCopy?.cta ?? direction.copy.cta,
      headline: input.fixedCopy?.main ?? direction.copy.headline,
      subheadline: input.fixedCopy?.sub ?? direction.copy.subheadline,
    },
  }));
}
