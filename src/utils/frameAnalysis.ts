import type { FigmaFrameData } from "../schemas/figmaFrame";

export function summarizeFrame(frame: FigmaFrameData): string {
  return `${frame.name}: ${frame.width}x${frame.height}, text=${frame.textNodes.length}, shapes=${frame.shapeNodes.length}`;
}
