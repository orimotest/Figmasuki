import { generateBackground } from "../providers";
import type { BackgroundBrief, BackgroundResult } from "../schemas/background";

export async function runFinishWorkflow(brief: BackgroundBrief): Promise<BackgroundResult> {
  return generateBackground(brief);
}
