export function ensureSelectionHasFrame(): FrameNode {
  const frame = figma.currentPage.selection.find((node): node is FrameNode => node.type === "FRAME");
  if (!frame) {
    throw new Error("Select a frame.");
  }
  return frame;
}

export function ensureSelectionHasMultipleFrames(): FrameNode[] {
  const frames = figma.currentPage.selection.filter((node): node is FrameNode => node.type === "FRAME");
  if (frames.length < 2) {
    throw new Error("Select at least two frames.");
  }
  return frames;
}
