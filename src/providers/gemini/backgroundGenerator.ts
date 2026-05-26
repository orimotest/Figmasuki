import type { BackgroundBrief, BackgroundResult } from "../../schemas/background";
import { demoGenerateBackground } from "../demo/demoBackground";

export async function generateBackgroundWithGemini(brief: BackgroundBrief): Promise<BackgroundResult> {
  const result = await demoGenerateBackground(brief);
  return {
    ...result,
    id: `gemini_ready_${result.id}`,
    status: "stub",
    message: "Gemini背景生成の接続準備があります。現在は編集可能なFigma図形背景で続行しました。",
    providerMeta: {
      provider: "gemini",
      fallbackUsed: true,
      fallbackReason: "Gemini image generation is not configured, so editable Figma shape backgrounds were used.",
    },
  };
}
