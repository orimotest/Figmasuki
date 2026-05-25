import { explore } from "../providers";
import type { ExploreInput } from "../schemas/input";
import type { ExploreResult } from "../schemas/svg";

export async function runExploreWorkflow(input: ExploreInput): Promise<ExploreResult> {
  const result = await explore(input);
  if (result.directions.length === 0) {
    throw new Error("Provider returned no directions.");
  }
  return result;
}
