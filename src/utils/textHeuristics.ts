import type { FigmaTextNodeData } from "../schemas/figmaFrame";

export function getTotalTextLength(textNodes: FigmaTextNodeData[]): number {
  return textNodes.reduce((total, node) => total + node.characters.trim().length, 0);
}
