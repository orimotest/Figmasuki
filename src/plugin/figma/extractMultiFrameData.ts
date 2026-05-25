import type { FigmaFrameData } from "../../schemas/figmaFrame";
import { serializeFrame } from "./extractFrameData";

export function extractMultiFrameData(): FigmaFrameData[] {
  const selection = figma.currentPage.selection;
  if (selection.length < 2) {
    throw new Error("比較する案を2つ以上選択してください。探索で配置したバナー案を2〜5個選ぶと比較できます。");
  }
  const nonFrames = selection.filter((node) => node.type !== "FRAME");
  if (nonFrames.length > 0) {
    throw new Error("Frame以外が選択されています。バナー案のFrameだけを選択してから比較してください。");
  }
  const frames = selection.filter((node): node is FrameNode => node.type === "FRAME");
  if (frames.length < 2) {
    throw new Error("比較には2つ以上のフレームが必要です。");
  }
  return frames.map(serializeFrame);
}
