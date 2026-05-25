import type { BackgroundResult } from "../../schemas/background";
import { createOrReplaceBackgroundLayer } from "./createOrReplaceBackgroundLayer";

export function insertBackgroundImage(targetFrameId: string, background: BackgroundResult): void {
  if (!targetFrameId) {
    throw new Error("targetFrameId is required to apply a background.");
  }

  const node = figma.getNodeById(targetFrameId);
  if (!node || node.type !== "FRAME") {
    throw new Error("Target frame was not found. Select Compare again or choose a valid frame.");
  }

  createOrReplaceBackgroundLayer(node, background);
  figma.currentPage.selection = [node];
  figma.viewport.scrollAndZoomIntoView([node]);
}
