import type { BackgroundResult } from "../../schemas/background";

export function createOrReplaceBackgroundLayer(frame: FrameNode, background: BackgroundResult): FrameNode {
  const existing = frame.children.find((child) => child.name === "background");
  if (existing) {
    existing.remove();
  }

  const layer = figma.createFrame();
  layer.name = "background";
  layer.x = 0;
  layer.y = 0;
  layer.resize(frame.width, frame.height);
  layer.clipsContent = true;
  layer.fills = [{ type: "SOLID", color: hexToRgb(background.colors[0] ?? "#F8FAFC") }];

  const wash = figma.createRectangle();
  wash.name = "background/base-wash";
  wash.x = 0;
  wash.y = 0;
  wash.resize(frame.width, frame.height);
  wash.fills = [
    {
      type: "GRADIENT_LINEAR",
      gradientTransform: [
        [1, 0, 0],
        [0, 1, 0],
      ],
      gradientStops: [
        { position: 0, color: { ...hexToRgb(background.colors[0] ?? "#F8FAFC"), a: 1 } },
        { position: 1, color: { ...hexToRgb(background.colors[1] ?? "#E0F2FE"), a: 1 } },
      ],
    },
  ];
  layer.appendChild(wash);

  const accentA = figma.createEllipse();
  accentA.name = "background/accent-large";
  accentA.resize(frame.width * 0.42, frame.height * 0.72);
  accentA.x = frame.width * 0.62;
  accentA.y = frame.height * -0.16;
  accentA.opacity = 0.55;
  accentA.fills = [{ type: "SOLID", color: hexToRgb(background.colors[2] ?? "#93C5FD") }];
  layer.appendChild(accentA);

  const accentB = figma.createRectangle();
  accentB.name = "background/safe-area-softener";
  accentB.resize(frame.width * 0.54, frame.height * 0.18);
  accentB.x = frame.width * 0.08;
  accentB.y = frame.height * 0.72;
  accentB.cornerRadius = 24;
  accentB.opacity = 0.2;
  accentB.fills = [{ type: "SOLID", color: hexToRgb(background.colors[3] ?? "#0F172A") }];
  layer.appendChild(accentB);

  frame.insertChild(0, layer);
  return layer;
}

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3 ? normalized.split("").map((char) => `${char}${char}`).join("") : normalized;
  const intValue = Number.parseInt(value, 16);
  if (Number.isNaN(intValue)) {
    return { r: 0.95, g: 0.97, b: 1 };
  }
  return {
    r: ((intValue >> 16) & 255) / 255,
    g: ((intValue >> 8) & 255) / 255,
    b: (intValue & 255) / 255,
  };
}
