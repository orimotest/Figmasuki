import { CANVAS_SIZE } from "../../config/canvas";
import type {
  FigmaFrameData,
  FigmaFrameDerivedData,
  FigmaPaintData,
  FigmaShapeNodeData,
  FigmaTextNodeData,
  SafeAreaIssue,
} from "../../schemas/figmaFrame";

export function extractFrameData(): FigmaFrameData {
  const selection = figma.currentPage.selection;
  if (selection.length === 0) {
    throw new Error("No frame selected. Select exactly one Frame in Figma.");
  }
  if (selection.length > 1) {
    throw new Error("Select exactly one Frame. Multiple selections are handled in Compare.");
  }
  const selected = selection[0];
  if (selected.type !== "FRAME") {
    throw new Error("Selected object is not a Frame. Select exactly one Frame.");
  }
  return serializeFrame(selected);
}

export function serializeFrame(frame: FrameNode): FigmaFrameData {
  const textNodes = frame.findAll((node) => node.type === "TEXT").map((node) => serializeTextNode(node as TextNode));
  const shapeNodes = frame
    .findAll((node) => isShapeNode(node))
    .map((node) => serializeShapeNode(node as GeometryMixin & SceneNode));

  const baseFrame = {
    id: frame.id,
    name: frame.name,
    x: frame.x,
    y: frame.y,
    width: frame.width,
    height: frame.height,
    textNodes,
    shapeNodes,
  };

  return {
    ...baseFrame,
    derived: deriveFrameData(baseFrame),
  };
}

function serializeTextNode(node: TextNode): FigmaTextNodeData {
  const fills = serializeFills(node.fills);
  const font = serializeFontName(node.fontName);
  return {
    id: node.id,
    name: node.name,
    characters: node.characters,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fontSize: typeof node.fontSize === "number" ? node.fontSize : null,
    fontName: font.fontName,
    fontFamily: font.fontFamily,
    fills,
    color: firstSolidColor(fills),
    opacity: readOpacity(node),
    visible: node.visible,
  };
}

function isShapeNode(node: SceneNode): boolean {
  return ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR", "VECTOR", "LINE"].includes(node.type);
}

function serializeShapeNode(node: GeometryMixin & SceneNode): FigmaShapeNodeData {
  const fills = serializeFills(node.fills);
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    fills,
    color: firstSolidColor(fills),
    opacity: readOpacity(node),
    visible: node.visible,
  };
}

function readOpacity(node: SceneNode): number | undefined {
  return "opacity" in node && typeof node.opacity === "number" ? node.opacity : undefined;
}

function serializeFontName(fontName: TextNode["fontName"]): { fontName: string | null; fontFamily: string | null } {
  if (fontName === figma.mixed) {
    return { fontName: null, fontFamily: null };
  }
  return {
    fontName: `${fontName.family} ${fontName.style}`,
    fontFamily: fontName.family,
  };
}

function serializeFills(fills: ReadonlyArray<Paint> | PluginAPI["mixed"]): FigmaPaintData[] | undefined {
  if (fills === figma.mixed) {
    return undefined;
  }
  return fills.map((paint) => {
    if (paint.type === "SOLID") {
      return {
        type: paint.type,
        color: toRgbString(paint.color),
        opacity: paint.opacity ?? 1,
      };
    }
    return { type: paint.type };
  });
}

function toRgbString(color: RGB): string {
  return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
}

function firstSolidColor(fills?: FigmaPaintData[]): string | null {
  return fills?.find((fill) => fill.color)?.color ?? null;
}

type SerializableFrameBase = Omit<FigmaFrameData, "derived">;

function deriveFrameData(frame: SerializableFrameBase): FigmaFrameDerivedData {
  const visibleTextNodes = frame.textNodes.filter((node) => node.visible !== false);
  const fontSizes = visibleTextNodes.map((node) => node.fontSize).filter((value): value is number => typeof value === "number");
  const possibleMainTitle = findPossibleMainTitle(visibleTextNodes);
  const colors = collectColors(frame.textNodes, frame.shapeNodes);
  const elementDensity = getElementDensity(frame);

  return {
    textCount: visibleTextNodes.length,
    shapeCount: frame.shapeNodes.filter((node) => node.visible !== false).length,
    totalTextChars: visibleTextNodes.reduce((total, node) => total + node.characters.trim().length, 0),
    maxFontSize: fontSizes.length > 0 ? Math.max(...fontSizes) : null,
    minFontSize: fontSizes.length > 0 ? Math.min(...fontSizes) : null,
    colors,
    colorCount: colors.length,
    elementDensity,
    frameSizeMatchesCanvas: frame.width === CANVAS_SIZE.width && frame.height === CANVAS_SIZE.height,
    possibleMainTitle,
    possibleCTA: visibleTextNodes.find((node) => isCtaText(node.characters)),
    possibleDate: visibleTextNodes.find((node) => isDateText(node.characters)),
    safeAreaIssues: findSafeAreaIssues([...frame.textNodes, ...frame.shapeNodes]),
  };
}

function getElementDensity(frame: SerializableFrameBase): number {
  const elementArea = [...frame.textNodes, ...frame.shapeNodes].reduce((total, node) => total + node.width * node.height, 0);
  return Number((elementArea / Math.max(frame.width * frame.height, 1)).toFixed(3));
}

function collectColors(textNodes: FigmaTextNodeData[], shapeNodes: FigmaShapeNodeData[]): string[] {
  return Array.from(
    new Set(
      [...textNodes, ...shapeNodes]
        .flatMap((node) => node.fills ?? [])
        .map((fill) => fill.color)
        .filter((color): color is string => Boolean(color)),
    ),
  );
}

function findPossibleMainTitle(textNodes: FigmaTextNodeData[]): FigmaTextNodeData | undefined {
  return [...textNodes]
    .filter((node) => node.characters.trim().length > 0)
    .sort((a, b) => {
      const fontDiff = (b.fontSize ?? 0) - (a.fontSize ?? 0);
      if (fontDiff !== 0) return fontDiff;
      return b.width * b.height - a.width * a.height;
    })[0];
}

function isCtaText(text: string): boolean {
  return /(申し込む|参加する|視聴する|詳細を見る|無料|register|apply|join)/i.test(text);
}

function isDateText(text: string): boolean {
  return /(\d{1,2}[./月]\d{1,2}|20\d{2}|MON|TUE|WED|THU|FRI|SAT|SUN|月|火|水|木|金|土|日|\d{1,2}:\d{2})/i.test(text);
}

function findSafeAreaIssues(nodes: Array<FigmaTextNodeData | FigmaShapeNodeData>): SafeAreaIssue[] {
  const safe = CANVAS_SIZE.safeArea;
  const issues: SafeAreaIssue[] = [];

  nodes.forEach((node) => {
    if (node.visible === false) return;
    if (node.x < safe.x) {
      issues.push({ nodeId: node.id, nodeName: node.name, issue: "left", message: `${node.name} is outside the left safe area.` });
    }
    if (node.y < safe.y) {
      issues.push({ nodeId: node.id, nodeName: node.name, issue: "top", message: `${node.name} is outside the top safe area.` });
    }
    if (node.x + node.width > safe.x + safe.width) {
      issues.push({ nodeId: node.id, nodeName: node.name, issue: "right", message: `${node.name} is outside the right safe area.` });
    }
    if (node.y + node.height > safe.y + safe.height) {
      issues.push({ nodeId: node.id, nodeName: node.name, issue: "bottom", message: `${node.name} is outside the bottom safe area.` });
    }
  });

  return issues;
}
