import type { FigmaFrameData } from "../../schemas/figmaFrame";
import { serializeFrame } from "./extractFrameData";

export function extractMultiFrameData(): FigmaFrameData[] {
  const selection = figma.currentPage.selection;
  if (selection.length < 2) {
    throw new Error("Select at least two frames.");
  }
  const nonFrames = selection.filter((node) => node.type !== "FRAME");
  if (nonFrames.length > 0) {
    throw new Error("Compare only supports Frame selections. Remove non-frame objects and try again.");
  }
  const frames = selection.filter((node): node is FrameNode => node.type === "FRAME");
  if (frames.length < 2) {
    throw new Error("Select at least two frames.");
  }
  return frames.map(serializeFrame);
}
