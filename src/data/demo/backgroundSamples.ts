import type { BackgroundResult } from "../../schemas/background";

export const backgroundSamples: BackgroundResult[] = [
  {
    id: "background_demo_001",
    type: "figma_shapes",
    colors: ["#FAFAF7", "#E5E7EB", "#CCFBF1", "#8B5CF6"],
    styleName: "editorial paper gradient",
    status: "stub",
    message: "サンプル背景を生成しました。",
    createdAt: "2026-05-25T00:00:00.000Z",
    brief: {
      id: "brief_demo_background_001",
      contentType: "note_thumbnail",
      targetFrameId: "demo_frame_note",
      targetFrameName: "Demo Note Thumbnail",
      mood: "editorial / quiet / thoughtful",
      style: "soft paper gradient with subtle abstract lines",
      avoid: ["text", "logo", "watermark"],
      safeAreaHint: "Keep the center readable and avoid busy details under text.",
      suggestedStyleKeywords: ["editorial texture", "paper grain", "subtle abstract lines"],
      promptText: "Soft geometric workspace background without text.",
      frameId: "demo_frame_note",
      prompt: "Soft geometric workspace background without text.",
      negativePrompt: "text, watermark, logo",
      styleNotes: ["subtle", "editable foreground safe", "16:9"],
    },
  },
];
