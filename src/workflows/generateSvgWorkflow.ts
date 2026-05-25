import { generateSvg } from "../providers";
import type { ExploreResult, SvgGenerationResult } from "../schemas/svg";

export async function runGenerateSvgWorkflow(exploreResult: ExploreResult): Promise<SvgGenerationResult> {
  const svgs = await Promise.all(exploreResult.directions.map((direction) => generateSvg(direction)));
  if (svgs.length === 0) {
    throw new Error("Provider returned no SVG candidates.");
  }
  const invalid = svgs.find((candidate) => !candidate.validation.valid);
  if (invalid) {
    throw new Error(`SVG validation failed for ${invalid.name}: ${invalid.validation.errors.join(" ")}`);
  }
  return { svgs };
}
