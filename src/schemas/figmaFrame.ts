export type FigmaPaintData = {
  type: string;
  color?: string;
  opacity?: number;
};

export type FigmaTextNodeData = {
  id: string;
  name: string;
  characters: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number | null;
  fontName?: string | null;
  fontFamily?: string | null;
  fills?: FigmaPaintData[];
  color?: string | null;
  opacity?: number;
  visible?: boolean;
};

export type FigmaShapeNodeData = {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fills?: FigmaPaintData[];
  color?: string | null;
  opacity?: number;
  visible?: boolean;
};

export type SafeAreaIssue = {
  nodeId: string;
  nodeName: string;
  issue: "left" | "right" | "top" | "bottom";
  message: string;
};

export type FigmaFrameDerivedData = {
  textCount: number;
  shapeCount: number;
  totalTextChars: number;
  maxFontSize: number | null;
  minFontSize: number | null;
  colors: string[];
  colorCount: number;
  elementDensity: number;
  frameSizeMatchesCanvas: boolean;
  possibleMainTitle?: FigmaTextNodeData;
  possibleCTA?: FigmaTextNodeData;
  possibleDate?: FigmaTextNodeData;
  safeAreaIssues: SafeAreaIssue[];
};

export type FigmaFrameData = {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  textNodes: FigmaTextNodeData[];
  shapeNodes: FigmaShapeNodeData[];
  derived: FigmaFrameDerivedData;
};
