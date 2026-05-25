import type { BackgroundBrief, BackgroundResult } from "../../schemas/background";
import { demoGenerateBackground } from "../demo/demoBackground";

export async function generateBackgroundWithGemini(brief: BackgroundBrief): Promise<BackgroundResult> {
  const result = await demoGenerateBackground(brief);
  return {
    ...result,
    id: `gemini_ready_${result.id}`,
    status: "stub",
    message: "Gemini background generation is prepared but still uses editable demo Figma shapes in this MVP.",
    providerMeta: {
      provider: "gemini",
      fallbackUsed: true,
      fallbackReason: "Gemini image generation is intentionally stubbed for this local MVP.",
    },
  };
}
