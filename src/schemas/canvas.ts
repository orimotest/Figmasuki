export type AspectRatio = "16:9";

export type SafeArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CanvasSize = {
  width: 800;
  height: 450;
  aspectRatio: AspectRatio;
  safeArea: SafeArea;
};
