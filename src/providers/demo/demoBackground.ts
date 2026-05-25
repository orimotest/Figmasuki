import type { BackgroundBrief, BackgroundResult } from "../../schemas/background";

export async function demoGenerateBackground(brief: BackgroundBrief): Promise<BackgroundResult> {
  const isSeminar = brief.contentType === "seminar_banner";
  return {
    id: `background_${brief.id}_${Date.now().toString(36)}`,
    brief,
    type: "figma_shapes",
    colors: isSeminar ? ["#E0F2FE", "#DBEAFE", "#93C5FD", "#0F172A"] : ["#FAFAF7", "#E5E7EB", "#CCFBF1", "#8B5CF6"],
    styleName: isSeminar ? "soft tech gradient" : "editorial paper gradient",
    status: "generated",
    message: "Demo background generated as editable Figma shapes.",
    createdAt: new Date().toISOString(),
    providerMeta: {
      provider: "demo",
      fallbackUsed: false,
    },
  };
}
