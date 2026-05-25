import { CANVAS_SIZE } from "../../config/canvas";

export function CanvasBadge() {
  return (
    <span className="canvas-badge">
      {CANVAS_SIZE.width}x{CANVAS_SIZE.height} 固定 / safe {CANVAS_SIZE.safeArea.width}x{CANVAS_SIZE.safeArea.height}
    </span>
  );
}
