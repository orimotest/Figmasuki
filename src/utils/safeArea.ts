import { CANVAS_SIZE } from "../config/canvas";

export function isInsideSafeArea(bounds: { x: number; y: number; width: number; height: number }): boolean {
  const safe = CANVAS_SIZE.safeArea;
  return (
    bounds.x >= safe.x &&
    bounds.y >= safe.y &&
    bounds.x + bounds.width <= safe.x + safe.width &&
    bounds.y + bounds.height <= safe.y + safe.height
  );
}
