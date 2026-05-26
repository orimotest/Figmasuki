"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

  // src/config/app.ts
  var appConfig = {
    name: "AI Cover Studio",
    uiWidth: 960,
    uiHeight: 720
  };

  // src/config/runtimeApiSettings.ts
  var RUNTIME_API_SETTINGS_STORAGE_KEY = "ai-cover-studio-runtime-api-settings";

  // src/plugin/figma/createSvgNode.ts
  var insertedSvgCount = 0;
  function createSvgNode(svg, name = "Generated SVG Layout", options = {}) {
    var _a, _b;
    if (!svg.trim()) {
      throw new Error("SVG is empty.");
    }
    const node = figma.createNodeFromSvg(svg);
    node.name = name;
    const offset = insertedSvgCount * 36;
    node.x = (_a = options.x) != null ? _a : figma.viewport.center.x - 400 + offset;
    node.y = (_b = options.y) != null ? _b : figma.viewport.center.y - 225 + offset;
    insertedSvgCount += 1;
    figma.currentPage.appendChild(node);
    if (options.select !== false) {
      figma.currentPage.selection = [node];
    }
    if (options.zoom !== false) {
      figma.viewport.scrollAndZoomIntoView([node]);
    }
    return node;
  }

  // src/config/canvas.ts
  var CANVAS_SIZE = {
    width: 800,
    height: 450,
    aspectRatio: "16:9",
    safeArea: {
      x: 48,
      y: 40,
      width: 704,
      height: 370
    }
  };

  // src/plugin/figma/extractFrameData.ts
  function extractFrameData() {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      throw new Error("\u8A3A\u65AD\u3059\u308B\u30D5\u30EC\u30FC\u30E0\u304C\u9078\u629E\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002Figma\u30AD\u30E3\u30F3\u30D0\u30B9\u4E0A\u3067\u30D0\u30CA\u30FC\u6848\u30921\u3064\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    if (selection.length > 1) {
      throw new Error("\u8A3A\u65AD\u3067\u306F1\u3064\u3060\u3051\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u8907\u6570\u6848\u3092\u898B\u305F\u3044\u5834\u5408\u306F\u6BD4\u8F03\u753B\u9762\u3092\u4F7F\u3044\u307E\u3059\u3002");
    }
    const selected = selection[0];
    if (selected.type !== "FRAME") {
      throw new Error("\u9078\u629E\u4E2D\u306E\u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u306FFrame\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u63A2\u7D22\u3067\u914D\u7F6E\u3057\u305F\u30D0\u30CA\u30FC\u6848\u306EFrame\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    return serializeFrame(selected);
  }
  function serializeFrame(frame) {
    const textNodes = frame.findAll((node) => node.type === "TEXT").map((node) => serializeTextNode(node));
    const shapeNodes = frame.findAll((node) => isShapeNode(node)).map((node) => serializeShapeNode(node));
    const baseFrame = {
      id: frame.id,
      name: frame.name,
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height,
      textNodes,
      shapeNodes
    };
    return __spreadProps(__spreadValues({}, baseFrame), {
      derived: deriveFrameData(baseFrame)
    });
  }
  function serializeTextNode(node) {
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
      visible: node.visible
    };
  }
  function isShapeNode(node) {
    return ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR", "VECTOR", "LINE"].includes(node.type);
  }
  function serializeShapeNode(node) {
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
      visible: node.visible
    };
  }
  function readOpacity(node) {
    return "opacity" in node && typeof node.opacity === "number" ? node.opacity : void 0;
  }
  function serializeFontName(fontName) {
    if (fontName === figma.mixed) {
      return { fontName: null, fontFamily: null };
    }
    return {
      fontName: `${fontName.family} ${fontName.style}`,
      fontFamily: fontName.family
    };
  }
  function serializeFills(fills) {
    if (fills === figma.mixed) {
      return void 0;
    }
    return fills.map((paint) => {
      var _a;
      if (paint.type === "SOLID") {
        return {
          type: paint.type,
          color: toRgbString(paint.color),
          opacity: (_a = paint.opacity) != null ? _a : 1
        };
      }
      return { type: paint.type };
    });
  }
  function toRgbString(color) {
    return `rgb(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)})`;
  }
  function firstSolidColor(fills) {
    var _a, _b;
    return (_b = (_a = fills == null ? void 0 : fills.find((fill) => fill.color)) == null ? void 0 : _a.color) != null ? _b : null;
  }
  function deriveFrameData(frame) {
    const visibleTextNodes = frame.textNodes.filter((node) => node.visible !== false);
    const fontSizes = visibleTextNodes.map((node) => node.fontSize).filter((value) => typeof value === "number");
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
      safeAreaIssues: findSafeAreaIssues([...frame.textNodes, ...frame.shapeNodes])
    };
  }
  function getElementDensity(frame) {
    const elementArea = [...frame.textNodes, ...frame.shapeNodes].reduce((total, node) => total + node.width * node.height, 0);
    return Number((elementArea / Math.max(frame.width * frame.height, 1)).toFixed(3));
  }
  function collectColors(textNodes, shapeNodes) {
    return Array.from(
      new Set(
        [...textNodes, ...shapeNodes].flatMap((node) => {
          var _a;
          return (_a = node.fills) != null ? _a : [];
        }).map((fill) => fill.color).filter((color) => Boolean(color))
      )
    );
  }
  function findPossibleMainTitle(textNodes) {
    return [...textNodes].filter((node) => node.characters.trim().length > 0).sort((a, b) => {
      var _a, _b;
      const fontDiff = ((_a = b.fontSize) != null ? _a : 0) - ((_b = a.fontSize) != null ? _b : 0);
      if (fontDiff !== 0) return fontDiff;
      return b.width * b.height - a.width * a.height;
    })[0];
  }
  function isCtaText(text) {
    return /(申し込む|参加する|視聴する|詳細を見る|無料|register|apply|join)/i.test(text);
  }
  function isDateText(text) {
    return /(\d{1,2}[./月]\d{1,2}|20\d{2}|MON|TUE|WED|THU|FRI|SAT|SUN|月|火|水|木|金|土|日|\d{1,2}:\d{2})/i.test(text);
  }
  function findSafeAreaIssues(nodes) {
    const safe = CANVAS_SIZE.safeArea;
    const issues = [];
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

  // src/plugin/figma/extractMultiFrameData.ts
  function extractMultiFrameData() {
    const selection = figma.currentPage.selection;
    if (selection.length < 2) {
      throw new Error("\u6BD4\u8F03\u3059\u308B\u6848\u30922\u3064\u4EE5\u4E0A\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u63A2\u7D22\u3067\u914D\u7F6E\u3057\u305F\u30D0\u30CA\u30FC\u6848\u30922\u301C5\u500B\u9078\u3076\u3068\u6BD4\u8F03\u3067\u304D\u307E\u3059\u3002");
    }
    const nonFrames = selection.filter((node) => node.type !== "FRAME");
    if (nonFrames.length > 0) {
      throw new Error("Frame\u4EE5\u5916\u304C\u9078\u629E\u3055\u308C\u3066\u3044\u307E\u3059\u3002\u30D0\u30CA\u30FC\u6848\u306EFrame\u3060\u3051\u3092\u9078\u629E\u3057\u3066\u304B\u3089\u6BD4\u8F03\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
    }
    const frames = selection.filter((node) => node.type === "FRAME");
    if (frames.length < 2) {
      throw new Error("\u6BD4\u8F03\u306B\u306F2\u3064\u4EE5\u4E0A\u306E\u30D5\u30EC\u30FC\u30E0\u304C\u5FC5\u8981\u3067\u3059\u3002");
    }
    return frames.map(serializeFrame);
  }

  // src/plugin/figma/createOrReplaceBackgroundLayer.ts
  function createOrReplaceBackgroundLayer(frame, background) {
    var _a, _b, _c, _d, _e;
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
    layer.fills = [{ type: "SOLID", color: hexToRgb((_a = background.colors[0]) != null ? _a : "#F8FAFC") }];
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
          [0, 1, 0]
        ],
        gradientStops: [
          { position: 0, color: __spreadProps(__spreadValues({}, hexToRgb((_b = background.colors[0]) != null ? _b : "#F8FAFC")), { a: 1 }) },
          { position: 1, color: __spreadProps(__spreadValues({}, hexToRgb((_c = background.colors[1]) != null ? _c : "#E0F2FE")), { a: 1 }) }
        ]
      }
    ];
    layer.appendChild(wash);
    const accentA = figma.createEllipse();
    accentA.name = "background/accent-large";
    accentA.resize(frame.width * 0.42, frame.height * 0.72);
    accentA.x = frame.width * 0.62;
    accentA.y = frame.height * -0.16;
    accentA.opacity = 0.55;
    accentA.fills = [{ type: "SOLID", color: hexToRgb((_d = background.colors[2]) != null ? _d : "#93C5FD") }];
    layer.appendChild(accentA);
    const accentB = figma.createRectangle();
    accentB.name = "background/safe-area-softener";
    accentB.resize(frame.width * 0.54, frame.height * 0.18);
    accentB.x = frame.width * 0.08;
    accentB.y = frame.height * 0.72;
    accentB.cornerRadius = 24;
    accentB.opacity = 0.2;
    accentB.fills = [{ type: "SOLID", color: hexToRgb((_e = background.colors[3]) != null ? _e : "#0F172A") }];
    layer.appendChild(accentB);
    frame.insertChild(0, layer);
    return layer;
  }
  function hexToRgb(hex) {
    const normalized = hex.replace("#", "");
    const value = normalized.length === 3 ? normalized.split("").map((char) => `${char}${char}`).join("") : normalized;
    const intValue = Number.parseInt(value, 16);
    if (Number.isNaN(intValue)) {
      return { r: 0.95, g: 0.97, b: 1 };
    }
    return {
      r: (intValue >> 16 & 255) / 255,
      g: (intValue >> 8 & 255) / 255,
      b: (intValue & 255) / 255
    };
  }

  // src/plugin/figma/insertBackgroundImage.ts
  function insertBackgroundImage(targetFrameId, background) {
    if (!targetFrameId) {
      throw new Error("targetFrameId is required to apply a background.");
    }
    const node = figma.getNodeById(targetFrameId);
    if (!node || node.type !== "FRAME") {
      throw new Error("Target frame was not found. Select Compare again or choose a valid frame.");
    }
    createOrReplaceBackgroundLayer(node, background);
    figma.currentPage.selection = [node];
    figma.viewport.scrollAndZoomIntoView([node]);
  }

  // src/utils/guards.ts
  function isRecord(value) {
    return typeof value === "object" && value !== null;
  }
  function hasString(value, key) {
    return typeof value[key] === "string";
  }

  // src/plugin/figma/messageBridge.ts
  function postToUi(message) {
    figma.ui.postMessage(message);
  }
  function parsePluginRequestMessage(value) {
    if (!isRecord(value) || !hasString(value, "type")) {
      return null;
    }
    if (value.type === "REQUEST_SELECTED_FRAME" || value.type === "REQUEST_SELECTED_FRAMES" || value.type === "LOAD_API_SETTINGS") {
      return { type: value.type };
    }
    if ((value.type === "SAVE_API_SETTINGS" || value.type === "TEST_API_SETTINGS") && isRecord(value.payload)) {
      return { type: value.type, payload: value.payload };
    }
    if (value.type === "RESIZE_UI" && isRecord(value.payload)) {
      const width = typeof value.payload.width === "number" ? value.payload.width : 960;
      const height = typeof value.payload.height === "number" ? value.payload.height : 720;
      return {
        type: "RESIZE_UI",
        payload: {
          width: Math.max(560, Math.min(1280, Math.round(width))),
          height: Math.max(560, Math.min(920, Math.round(height)))
        }
      };
    }
    if (value.type === "INSERT_SVG" && isRecord(value.payload) && hasString(value.payload, "svg")) {
      return {
        type: "INSERT_SVG",
        payload: {
          svg: value.payload.svg,
          name: typeof value.payload.name === "string" ? value.payload.name : void 0
        }
      };
    }
    if (value.type === "INSERT_SVG_BATCH" && isRecord(value.payload) && Array.isArray(value.payload.items)) {
      return {
        type: "INSERT_SVG_BATCH",
        payload: {
          items: value.payload.items.filter((item) => isRecord(item) && hasString(item, "svg")).map((item) => ({ svg: item.svg, name: typeof item.name === "string" ? item.name : void 0 })),
          x: typeof value.payload.x === "number" ? value.payload.x : void 0,
          y: typeof value.payload.y === "number" ? value.payload.y : void 0
        }
      };
    }
    if (value.type === "PLACE_EXPLORE_PACKAGE" && isRecord(value.payload)) {
      return { type: "PLACE_EXPLORE_PACKAGE", payload: value.payload };
    }
    if (value.type === "RENDER_PROCESS_BOARD" && isRecord(value.payload)) {
      return { type: "RENDER_PROCESS_BOARD", payload: value.payload };
    }
    if (value.type === "RENDER_PROCESS_STAGE_BOARD" && isRecord(value.payload) && isRecord(value.payload.project) && hasString(value.payload, "stage") && isProcessBoardStage(value.payload.stage)) {
      return {
        type: "RENDER_PROCESS_STAGE_BOARD",
        payload: {
          project: value.payload.project,
          stage: value.payload.stage,
          x: typeof value.payload.x === "number" ? value.payload.x : void 0,
          y: typeof value.payload.y === "number" ? value.payload.y : void 0,
          zoom: typeof value.payload.zoom === "boolean" ? value.payload.zoom : void 0
        }
      };
    }
    if (value.type === "RENDER_DIAGNOSIS_BOARD" && isRecord(value.payload)) {
      return { type: "RENDER_DIAGNOSIS_BOARD", payload: value.payload };
    }
    if (value.type === "RENDER_COMPARE_BOARD" && isRecord(value.payload)) {
      return { type: "RENDER_COMPARE_BOARD", payload: value.payload };
    }
    if (value.type === "RENDER_FINISH_BOARD" && isRecord(value.payload) && isRecord(value.payload.backgroundResult)) {
      return {
        type: "RENDER_FINISH_BOARD",
        payload: {
          backgroundResult: value.payload.backgroundResult,
          comparisonResult: isRecord(value.payload.comparisonResult) ? value.payload.comparisonResult : void 0
        }
      };
    }
    if (value.type === "APPLY_BACKGROUND" && isRecord(value.payload) && hasString(value.payload, "targetFrameId") && isRecord(value.payload.backgroundResult)) {
      return {
        type: "APPLY_BACKGROUND",
        payload: {
          targetFrameId: value.payload.targetFrameId,
          backgroundResult: value.payload.backgroundResult
        }
      };
    }
    return null;
  }
  function isProcessBoardStage(value) {
    return [
      "project_header",
      "ideas",
      "typography_drafts",
      "refined_svgs",
      "diagnosis",
      "compare",
      "background_variations",
      "final_candidate"
    ].includes(value);
  }
  function getErrorMessage(error) {
    return error instanceof Error ? error.message : "Unexpected plugin error.";
  }

  // src/schemas/layoutDraft.ts
  var typographyDraftLayoutLabels = {
    left_hero: "\u5DE6\u5BC4\u305B",
    center_focus: "\u4E2D\u592E\u914D\u7F6E",
    split_panel: "\u5DE6\u53F3\u5206\u5272",
    card_stack: "\u30AB\u30FC\u30C9\u6574\u7406",
    cta_emphasis: "CTA\u5F37\u8ABF",
    editorial_whitespace: "\u4F59\u767D\u578B",
    dark_center: "\u6FC3\u8272\u4E2D\u592E",
    trust_panel: "\u4FE1\u983C\u611F\u30D1\u30CD\u30EB",
    beginner_soft: "\u521D\u5FC3\u8005\u5411\u3051",
    meta_first: "\u958B\u50AC\u60C5\u5831\u512A\u5148"
  };

  // src/plugin/figma/renderProcessBoard.ts
  var COLORS = {
    canvas: { r: 0.969, g: 0.976, b: 0.988 },
    board: { r: 1, g: 1, b: 1 },
    card: { r: 0.984, g: 0.988, b: 0.996 },
    border: { r: 0.898, g: 0.918, b: 0.949 },
    text: { r: 0.067, g: 0.094, b: 0.153 },
    muted: { r: 0.294, g: 0.333, b: 0.388 },
    blue: { r: 0.145, g: 0.388, b: 0.922 },
    paleBlue: { r: 0.929, g: 0.961, b: 1 },
    green: { r: 0.086, g: 0.639, b: 0.29 },
    orange: { r: 0.961, g: 0.62, b: 0.043 }
  };
  var FONT_REGULAR = { family: "Inter", style: "Regular" };
  var FONT_BOLD = { family: "Inter", style: "Bold" };
  var DEFAULT_LAYOUT_BASE = {
    xOffset: -3800,
    yOffset: -760
  };
  var PROCESS_STAGE_POSITIONS = {
    project_header: { x: 0, y: 0 },
    ideas: { x: 700, y: 0 },
    typography_drafts: { x: 1992, y: 0 },
    refined_svgs: { x: 3484, y: 0 },
    diagnosis: { x: 4916, y: 800 },
    compare: { x: 4916, y: 0 },
    background_variations: { x: 5888, y: 0 },
    final_candidate: { x: 6840, y: 0 }
  };
  async function renderProcessBoard(project, options = {}) {
    var _a, _b;
    await loadFonts();
    const startX = (_a = options.x) != null ? _a : figma.viewport.center.x + DEFAULT_LAYOUT_BASE.xOffset;
    const startY = (_b = options.y) != null ? _b : figma.viewport.center.y + DEFAULT_LAYOUT_BASE.yOffset;
    const boards = [
      renderProcessStageAt(project, "project_header", startX, startY),
      renderProcessStageAt(project, "ideas", startX, startY),
      renderProcessStageAt(project, "typography_drafts", startX, startY),
      renderProcessStageAt(project, "refined_svgs", startX, startY),
      ...project.diagnosisResults.length > 0 ? [renderProcessStageAt(project, "diagnosis", startX, startY)] : [],
      renderProcessStageAt(project, "compare", startX, startY),
      renderProcessStageAt(project, "background_variations", startX, startY),
      renderProcessStageAt(project, "final_candidate", startX, startY)
    ];
    if (options.zoom !== false) {
      figma.currentPage.selection = boards;
      figma.viewport.scrollAndZoomIntoView(boards);
    }
    return boards;
  }
  async function renderProcessStageBoard(project, stage, options = {}) {
    var _a, _b;
    await loadFonts();
    const defaultPosition = getDefaultStagePosition(stage);
    const startX = (_a = options.x) != null ? _a : defaultPosition.x;
    const startY = (_b = options.y) != null ? _b : defaultPosition.y;
    const board = renderProcessStage(project, stage, startX, startY);
    if (options.zoom !== false) {
      figma.currentPage.selection = [board];
      figma.viewport.scrollAndZoomIntoView([board]);
    }
    return board;
  }
  function renderProcessStageAt(project, stage, baseX, baseY) {
    const position = PROCESS_STAGE_POSITIONS[stage];
    return renderProcessStage(project, stage, baseX + position.x, baseY + position.y);
  }
  function getDefaultStagePosition(stage) {
    const baseX = figma.viewport.center.x + DEFAULT_LAYOUT_BASE.xOffset;
    const baseY = figma.viewport.center.y + DEFAULT_LAYOUT_BASE.yOffset;
    const position = PROCESS_STAGE_POSITIONS[stage];
    return { x: baseX + position.x, y: baseY + position.y };
  }
  function renderProcessStage(project, stage, x, y) {
    var _a, _b, _c;
    const workflow = project.stageWorkflow;
    switch (stage) {
      case "project_header":
        return renderProjectHeaderBoard(null, project, x, y);
      case "ideas":
        return renderIdeaExploreBoard(null, (_a = workflow == null ? void 0 : workflow.ideaDirections) != null ? _a : [], x, y);
      case "typography_drafts":
        return renderTypographyDraftBoard(null, (_b = workflow == null ? void 0 : workflow.typographyDrafts) != null ? _b : [], x, y);
      case "refined_svgs":
        return renderRefinedSvgBoard(null, workflow, project.svgCandidates, x, y);
      case "diagnosis":
        return renderDiagnosisBoardPanel(null, project.diagnosisResults, x, y);
      case "compare":
        return renderCompareBoardPanel(null, project.comparisonResult, workflow == null ? void 0 : workflow.demoComparison, x, y);
      case "background_variations":
        return renderBackgroundVariationsBoard(null, (_c = workflow == null ? void 0 : workflow.backgroundVariations) != null ? _c : [], project.backgroundResult, x, y);
      case "final_candidate":
        return renderFinalCandidateBoard(null, project, x, y);
    }
  }
  async function renderStandaloneDiagnosisBoard(result) {
    await loadFonts();
    const board = createStandaloneBoard("Diagnosis Board", "\u8A3A\u65AD\u7D50\u679C\u3092Figma\u4E0A\u306B\u8A18\u9332\u3057\u307E\u3059\u3002", 900, 900);
    renderDiagnosisContent(board, [result], 32, 120, 836);
    placeStandalone(board);
    return board;
  }
  async function renderStandaloneCompareBoard(result) {
    await loadFonts();
    const board = createStandaloneBoard("Compare Board", "\u6BD4\u8F03\u7D50\u679C\u3068background brief\u3092Figma\u4E0A\u306B\u8A18\u9332\u3057\u307E\u3059\u3002", 980, 1040);
    renderCompareContent(board, result, 32, 120, 916);
    placeStandalone(board);
    return board;
  }
  async function renderStandaloneFinishBoard(result, comparison) {
    await loadFonts();
    const board = createStandaloneBoard("Finish Board", "\u4ED5\u4E0A\u3052\u7D50\u679C\u3092Figma\u4E0A\u306B\u8A18\u9332\u3057\u307E\u3059\u3002", 900, 900);
    renderFinishContent(board, result, comparison, 32, 120, 836);
    placeStandalone(board);
    return board;
  }
  function renderProjectHeaderBoard(parent2, project, x, y) {
    const board = createSection("01 Project Header", "\u5236\u4F5C\u6761\u4EF6\u3068\u5B9F\u884C\u30E2\u30FC\u30C9", x, y, 620, 720);
    appendBoard(parent2, board);
    renderProjectHeaderContent(board, project, 24, 92, 572);
    return board;
  }
  function renderProjectHeaderContent(parent2, project, x, y, width) {
    var _a, _b;
    const summary = createCard(x, y, width, 312);
    parent2.appendChild(summary);
    addMetric(summary, "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u540D", project.projectName, 20, 20, width - 40);
    addMetric(summary, "\u7528\u9014", project.contentType === "seminar_banner" ? "\u30BB\u30DF\u30CA\u30FC / \u30A6\u30A7\u30D3\u30CA\u30FC\u30D0\u30CA\u30FC" : "note / \u30D6\u30ED\u30B0\u30B5\u30E0\u30CD\u30A4\u30EB", 20, 80, width - 40);
    addMetric(summary, "\u30B5\u30A4\u30BA", `${project.canvasSize.width} x ${project.canvasSize.height}`, 20, 140, 180);
    addMetric(summary, "\u5165\u529B\u30BF\u30A4\u30D7", project.inputMode === "fixed_copy" ? "\u78BA\u5B9A\u30B3\u30D4\u30FC\u304B\u3089\u4F5C\u308B" : "\u8981\u4EF6\u304B\u3089\u4F5C\u308B", 230, 140, 220);
    addMetric(summary, "\u5B9F\u884C\u30E2\u30FC\u30C9", project.providerMeta.mode, 20, 200, width - 40);
    addMetric(summary, "\u4F5C\u6210\u65E5\u6642", new Date(project.createdAt).toLocaleString("ja-JP"), 20, 260, width - 40);
    const brief = createCard(x, y + 336, width, 238);
    parent2.appendChild(brief);
    addText(brief, "\u5165\u529B\u8981\u4EF6", 18, 18, { size: 14, bold: true, color: COLORS.blue });
    addText(brief, project.inputSummary.brief, 18, 48, { size: 13, width: width - 36, height: 64 });
    addText(brief, "\u30BF\u30FC\u30B2\u30C3\u30C8", 18, 128, { size: 10, bold: true, color: COLORS.blue });
    addText(brief, (_a = project.inputSummary.targetAudience) != null ? _a : "\u672A\u6307\u5B9A", 18, 148, { size: 12, width: width - 36 });
    addText(brief, "\u30B4\u30FC\u30EB", 18, 182, { size: 10, bold: true, color: COLORS.blue });
    addText(brief, (_b = project.inputSummary.goal) != null ? _b : "\u672A\u6307\u5B9A", 18, 202, { size: 12, width: width - 36 });
  }
  function renderIdeaExploreBoard(parent2, ideas, x, y) {
    const board = createSection("02 30 Ideas Explore", "30\u6848\u30925\u3064\u306E\u65B9\u5411\u306B\u6574\u7406\u3057\u300115\u6848\u306E\u6587\u5B57\u7D44\u307F\u3078\u9032\u3081\u308B\u5019\u88DC\u3092\u898B\u3048\u308B\u5316\u3057\u307E\u3059\u3002\u3053\u3053\u3067\u306FSVG\u306F\u7F6E\u304D\u307E\u305B\u3093\u3002", x, y, 1220, 900);
    appendBoard(parent2, board);
    addStageStats(board, [
      ["\u63A2\u7D22", "30\u6848"],
      ["Typography\u3078", `${ideas.filter((idea) => idea.status === "selected_for_typography").length}\u6848`],
      ["\u7D71\u5408/\u4FDD\u7559", `${ideas.filter((idea) => idea.status !== "selected_for_typography").length}\u6848`]
    ]);
    renderIdeaGrid(board, ideas, 24, 142, 1172);
    return board;
  }
  function renderTypographyDraftBoard(parent2, drafts, x, y) {
    const board = createSection("03 15 Typography Drafts", "\u5B8C\u6210\u30C7\u30B6\u30A4\u30F3\u3067\u306F\u306A\u304F\u3001\u6587\u5B57\u7D44\u307F\u30FB\u4F59\u767D\u30FBCTA\u4F4D\u7F6E\u3092\u691C\u8A0E\u3059\u308B\u8EFD\u91CFSVG\u3002", x, y, 1420, 1060);
    appendBoard(parent2, board);
    addStageStats(board, [
      ["\u30C9\u30E9\u30D5\u30C8", "15\u6848"],
      ["Refine\u3078", `${drafts.filter((draft) => draft.selectedForRefine).length}\u6848`],
      ["\u76EE\u7684", "\u6587\u5B57\u7D44\u307F\u78BA\u8A8D"]
    ]);
    renderDraftGrid(board, drafts, 24, 142, 1372);
    return board;
  }
  function renderRefinedSvgBoard(parent2, workflow, candidates, x, y) {
    const board = createSection("04 5 Refined SVGs", "Gemini\u3067\u4ED5\u4E0A\u3052\u308B\u60F3\u5B9A\u306E\u9AD8\u54C1\u8CEASVG\u3002\u5B9F\u7269\u30D5\u30EC\u30FC\u30E0\u306F\u4E0A\u90E8\u306B\u3082\u914D\u7F6E\u3055\u308C\u307E\u3059\u3002", x, y, 1360, 1060);
    appendBoard(parent2, board);
    addStageStats(board, [
      ["\u9AD8\u54C1\u8CEASVG", "5\u6848"],
      ["\u6BD4\u8F03\u8EF8", "\u65B9\u5411\u6027\u5DEE"],
      ["\u7DE8\u96C6", "SVG text"]
    ]);
    renderRefinedGrid(board, workflow, candidates, [], 24, 142, 1312);
    return board;
  }
  function renderDiagnosisBoardPanel(parent2, results, x, y) {
    const board = createSection("05 Diagnosis", "1\u6848\u3092\u9078\u629E\u3057\u3066\u3001\u5F37\u307F\u30FB\u61F8\u5FF5\u30FB\u6700\u521D\u306B\u76F4\u3059\u70B9\u3092\u8A18\u9332\u3002", x, y, 760, 720);
    appendBoard(parent2, board);
    renderDiagnosisContent(board, results, 24, 104, 712);
    return board;
  }
  function renderCompareBoardPanel(parent2, result, demoComparison, x, y) {
    const board = createSection("05 Compare Result", "5\u6848\u306E\u5F79\u5272\u3068\u5411\u304D\u4E0D\u5411\u304D\u3092\u6BD4\u8F03\u3057\u3001Primary / Secondary\u3092\u6C7A\u3081\u308B\u3002", x, y, 900, 720);
    appendBoard(parent2, board);
    renderCompareContent(board, result, 24, 104, 852, demoComparison);
    return board;
  }
  function renderBackgroundVariationsBoard(parent2, variations, result, x, y) {
    var _a;
    const board = createSection("06 Background Variations", "Primary\u6848\u306B\u3060\u3051\u80CC\u666F3\u6848\u3092\u4F5C\u308B\u3002\u6587\u5B57\u3068CTA\u306F\u7DE8\u96C6\u53EF\u80FD\u306A\u307E\u307E\u6B8B\u3057\u307E\u3059\u3002", x, y, 880, 720);
    appendBoard(parent2, board);
    addText(board, (_a = result == null ? void 0 : result.brief.promptText) != null ? _a : "\u6BD4\u8F03\u5F8C\u306Bbackground brief\u304C\u5165\u308A\u307E\u3059\u3002Demo\u3067\u306F\u80CC\u666F3\u6848\u306E\u65B9\u5411\u6027\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002", 24, 88, {
      size: 11,
      color: COLORS.muted,
      width: 820,
      height: 36
    });
    renderBackgroundGrid(board, variations, 24, 146, 832);
    return board;
  }
  function renderFinalCandidateBoard(parent2, project, x, y) {
    var _a;
    const board = createSection("07 Final Candidate", "\u9078\u3093\u3060\u6848\u3001\u9069\u7528\u80CC\u666F\u3001\u4EBA\u9593\u304C\u6B21\u306B\u8ABF\u6574\u3059\u308B\u30DD\u30A4\u30F3\u30C8\u3002", x, y, 760, 720);
    appendBoard(parent2, board);
    const final = (_a = project.stageWorkflow) == null ? void 0 : _a.finalCandidate;
    const card = createCard(24, 104, 712, 516);
    board.appendChild(card);
    if (!final) {
      addText(card, "\u6700\u7D42\u6848\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002\u6BD4\u8F03\u3068\u80CC\u666F\u4ED5\u4E0A\u3052\u306E\u5F8C\u306B\u8A18\u9332\u3055\u308C\u307E\u3059\u3002", 20, 24, { size: 13, color: COLORS.muted, width: 660 });
      return board;
    }
    addText(card, final.name, 20, 22, { size: 20, bold: true, color: COLORS.blue, width: 660 });
    addText(card, `\u63A1\u7528\u7406\u7531: ${final.reason}`, 20, 62, { size: 12, width: 660, height: 70 });
    addList(card, "\u7DE8\u96C6\u53EF\u80FD\u306A\u30EC\u30A4\u30E4\u30FC", final.editableLayers, 20, 156, 660);
    addList(card, "\u4EBA\u9593\u304C\u6B21\u306B\u8ABF\u6574\u3059\u308B\u30DD\u30A4\u30F3\u30C8", final.nextAdjustments, 20, 282, 660);
    addPreviewBox(card, 20, 416, "\u6700\u7D42\u6848\u306F\u4E0A\u90E8\u306E\u5B9F\u7269\u30D5\u30EC\u30FC\u30E0\u3067\u78BA\u8A8D", 660, 68);
    return board;
  }
  function renderIdeaGrid(parent2, ideas, x, y, width) {
    if (ideas.length === 0) {
      addEmpty(parent2, "30\u6848\u63A2\u7D22\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002Demo\u30D5\u30ED\u30FC\u3092\u8AAD\u307F\u8FBC\u3080\u3068\u8868\u793A\u3055\u308C\u307E\u3059\u3002", x, y, width);
      return;
    }
    const groups = chunk(ideas.slice(0, 30), 6);
    const groupWidth = (width - 24) / 2;
    groups.slice(0, 5).forEach((group, groupIndex) => {
      const col = groupIndex % 2;
      const rowIndex = Math.floor(groupIndex / 2);
      const groupFrame = createCard(x + col * (groupWidth + 24), y + rowIndex * 238, groupWidth, 218);
      parent2.appendChild(groupFrame);
      const selectedCount = group.filter((idea) => idea.status === "selected_for_typography").length;
      addText(groupFrame, getIdeaGroupTitle(groupIndex), 16, 14, { size: 14, bold: true, color: COLORS.blue, width: groupWidth - 160 });
      addPill(groupFrame, groupWidth - 132, 12, `${selectedCount}\u6848\u3092\u63A1\u7528`, COLORS.green, 112);
      addText(groupFrame, getIdeaGroupDescription(groupIndex), 16, 40, { size: 9, color: COLORS.muted, width: groupWidth - 32 });
      group.forEach((idea, ideaIndex) => {
        const itemCol = ideaIndex % 2;
        const itemRow = Math.floor(ideaIndex / 2);
        const itemWidth = (groupWidth - 42) / 2;
        const row = createFrame(
          `Idea / ${idea.name}`,
          16 + itemCol * (itemWidth + 10),
          68 + itemRow * 46,
          itemWidth,
          38,
          idea.status === "selected_for_typography" ? COLORS.paleBlue : COLORS.board
        );
        row.cornerRadius = 8;
        row.strokes = [{ type: "SOLID", color: idea.status === "selected_for_typography" ? COLORS.blue : COLORS.border }];
        row.strokeWeight = idea.status === "selected_for_typography" ? 1.5 : 1;
        groupFrame.appendChild(row);
        const statusLabel = idea.status === "selected_for_typography" ? "\u6B8B\u3059" : idea.status === "merged" ? "\u7D71\u5408" : "\u4FDD\u7559";
        const statusColor = idea.status === "selected_for_typography" ? COLORS.green : idea.status === "merged" ? COLORS.orange : COLORS.muted;
        addText(row, `${String(groupIndex * 6 + ideaIndex + 1).padStart(2, "0")} ${idea.name}`, 8, 7, {
          size: 8,
          bold: true,
          color: statusColor,
          width: itemWidth - 58
        });
        addPill(row, itemWidth - 52, 6, statusLabel, statusColor, 40);
        addText(row, idea.mainCopy.replace(/\n/g, " / "), 8, 22, { size: 7, bold: true, width: itemWidth - 16, height: 12 });
      });
    });
  }
  function getIdeaGroupTitle(index) {
    var _a;
    return (_a = ["\u8AB2\u984C\u5171\u611F", "\u53C2\u52A0\u30E1\u30EA\u30C3\u30C8", "\u5B9F\u52D9\u30CE\u30A6\u30CF\u30A6", "\u4FE1\u983C\u611F", "\u521D\u5FC3\u8005\u6B53\u8FCE"][index]) != null ? _a : `\u65B9\u5411 ${index + 1}`;
  }
  function getIdeaGroupDescription(index) {
    var _a;
    return (_a = [
      "\u4E0D\u5B89\u3084\u8FF7\u3044\u306B\u5BC4\u308A\u6DFB\u3044\u3001\u6700\u521D\u306E\u4E00\u6B69\u3092\u898B\u305B\u308B\u65B9\u5411\u3067\u3059\u3002",
      "\u53C2\u52A0\u5F8C\u306B\u5F97\u3089\u308C\u308B\u4FA1\u5024\u3092\u5148\u306B\u4F1D\u3048\u3001\u7533\u3057\u8FBC\u307F\u5224\u65AD\u3092\u52A9\u3051\u307E\u3059\u3002",
      "\u73FE\u5834\u3067\u4F7F\u3048\u308B\u5177\u4F53\u6027\u3092\u524D\u9762\u306B\u51FA\u3057\u3001\u5B9F\u52D9\u8005\u306B\u5C4A\u304D\u3084\u3059\u304F\u3057\u307E\u3059\u3002",
      "BtoB\u5411\u3051\u306B\u843D\u3061\u7740\u304D\u3068\u4FE1\u983C\u611F\u3092\u512A\u5148\u3057\u3066\u6574\u7406\u3057\u307E\u3059\u3002",
      "\u5C02\u9580\u77E5\u8B58\u306A\u3057\u3067\u3082\u53C2\u52A0\u3057\u3084\u3059\u3044\u5B89\u5FC3\u611F\u3092\u4F5C\u308A\u307E\u3059\u3002"
    ][index]) != null ? _a : "\u63A2\u7D22\u3057\u305F\u30B3\u30D4\u30FC\u65B9\u5411\u6027\u3067\u3059\u3002";
  }
  function chunk(items, size) {
    const groups = [];
    for (let index = 0; index < items.length; index += size) {
      groups.push(items.slice(index, index + size));
    }
    return groups;
  }
  function renderDraftGrid(parent2, drafts, x, y, width) {
    if (drafts.length === 0) {
      addEmpty(parent2, "15\u6848\u306ETypography Draft\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002Demo\u30D5\u30ED\u30FC\u3092\u8AAD\u307F\u8FBC\u3080\u3068\u8868\u793A\u3055\u308C\u307E\u3059\u3002", x, y, width);
      return;
    }
    const cardWidth = (width - 48) / 5;
    drafts.slice(0, 15).forEach((draft, index) => {
      const col = index % 5;
      const row = Math.floor(index / 5);
      const card = createCard(x + col * (cardWidth + 12), y + row * 292, cardWidth, 272);
      parent2.appendChild(card);
      addText(card, `${draft.name} / ${typographyDraftLayoutLabels[draft.layoutType]}`, 12, 10, {
        size: 10,
        bold: true,
        color: draft.selectedForRefine ? COLORS.green : COLORS.blue,
        width: cardWidth - 24
      });
      addText(card, draft.directionName, 12, 30, { size: 8, color: COLORS.muted, width: cardWidth - 24 });
      appendSvg(card, draft.svg, 12, 54, cardWidth - 24, 138, draft.name);
      addText(card, draft.evaluationMemo, 12, 204, { size: 8, color: COLORS.muted, width: cardWidth - 24, height: 28 });
      addPill(card, 12, 236, draft.selectedForRefine ? "5\u6848\u3078\u6B8B\u3059" : "\u6BD4\u8F03\u4FDD\u7559", draft.selectedForRefine ? COLORS.green : COLORS.muted, 90);
    });
  }
  function renderRefinedGrid(parent2, workflow, candidates, directions, x, y, width) {
    var _a;
    if (candidates.length === 0) {
      addEmpty(parent2, "5\u6848\u306E\u9AD8\u54C1\u8CEASVG\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002Demo\u30D5\u30ED\u30FC\u3092\u8AAD\u307F\u8FBC\u3080\u3068\u8868\u793A\u3055\u308C\u307E\u3059\u3002", x, y, width);
      return;
    }
    const byDirection = new Map(directions.map((direction) => [direction.id, direction]));
    const refined = (_a = workflow == null ? void 0 : workflow.refinedSvgCandidates) != null ? _a : candidates;
    refined.slice(0, 5).forEach((candidate, index) => {
      var _a2, _b, _c, _d, _e, _f, _g;
      const col = index % 2;
      const row = Math.floor(index / 2);
      const cardWidth = (width - 20) / 2;
      const card = createCard(x + col * (cardWidth + 20), y + row * 286, cardWidth, 266);
      parent2.appendChild(card);
      const direction = byDirection.get(candidate.directionId);
      addText(card, `${index + 1}. ${(_a2 = direction == null ? void 0 : direction.title) != null ? _a2 : candidate.name}`, 14, 12, { size: 13, bold: true, color: COLORS.blue, width: cardWidth - 28 });
      appendSvg(card, candidate.svg, 14, 40, 300, 170, candidate.name);
      addText(card, (_d = (_c = (_b = workflow == null ? void 0 : workflow.refinedSvgCandidates[index]) == null ? void 0 : _b.strength) != null ? _c : direction == null ? void 0 : direction.summary) != null ? _d : "\u65B9\u5411\u6027\u306E\u9055\u3044\u3092\u6BD4\u8F03\u3067\u304D\u308B\u6848\u3067\u3059\u3002", 330, 54, {
        size: 10,
        width: cardWidth - 350,
        height: 48
      });
      addText(card, (_g = (_f = (_e = workflow == null ? void 0 : workflow.refinedSvgCandidates[index]) == null ? void 0 : _e.concern) != null ? _f : direction == null ? void 0 : direction.riskNote) != null ? _g : "\u4ED5\u4E0A\u3052\u6642\u306B\u53EF\u8AAD\u6027\u3092\u78BA\u8A8D\u3057\u307E\u3059\u3002", 330, 120, {
        size: 9,
        color: COLORS.muted,
        width: cardWidth - 350,
        height: 52
      });
      addPill(card, 330, 194, candidate.meta.layoutType, COLORS.blue, 152);
    });
  }
  function renderBackgroundGrid(parent2, variations, x, y, width) {
    if (variations.length === 0) {
      addEmpty(parent2, "\u80CC\u666F3\u6848\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002\u6BD4\u8F03\u3067Primary\u6848\u3092\u9078\u3076\u3068\u751F\u6210\u65B9\u91DD\u304C\u5165\u308A\u307E\u3059\u3002", x, y, width);
      return;
    }
    const cardWidth = (width - 32) / 3;
    variations.slice(0, 3).forEach((variation, index) => {
      const card = createCard(x + index * (cardWidth + 16), y, cardWidth, 360);
      parent2.appendChild(card);
      addText(card, variation.name, 12, 12, { size: 12, bold: true, color: variation.selected ? COLORS.green : COLORS.blue, width: cardWidth - 24 });
      appendSvg(card, variation.svg, 12, 42, cardWidth - 24, 148, variation.name);
      addText(card, variation.direction, 12, 212, { size: 9, color: COLORS.muted, width: cardWidth - 24, height: 60 });
      addPill(card, 12, 306, variation.selected ? "\u9078\u629E\u4E2D" : `\u80CC\u666F\u6848 ${String.fromCharCode(65 + index)}`, variation.selected ? COLORS.green : COLORS.muted, 90);
    });
  }
  function renderDiagnosisContent(parent2, results, x, y, width) {
    const result = results[results.length - 1];
    const card = createCard(x, y, width, 500);
    parent2.appendChild(card);
    addText(card, "\u8A3A\u65AD\u7D50\u679C", 16, 14, { size: 16, bold: true, color: COLORS.blue });
    if (!result) {
      addText(card, "\u8A3A\u65AD\u7D50\u679C\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002Figma\u4E0A\u30671\u6848\u3092\u9078\u629E\u3057\u3066\u8A3A\u65AD\u3059\u308B\u3068\u3001\u3053\u3053\u306B\u8A18\u9332\u3055\u308C\u307E\u3059\u3002", 16, 48, {
        size: 11,
        color: COLORS.muted,
        width: width - 32
      });
      return;
    }
    addText(card, `\u5BFE\u8C61: ${result.frameName}`, 16, 46, { size: 11, bold: true, width: width - 32 });
    addText(card, result.summary, 16, 70, { size: 10, width: width - 32, height: 46 });
    addText(card, `\u6700\u521D\u306B\u4F1D\u308F\u308B\u3053\u3068: ${result.firstImpression}`, 16, 124, { size: 9, color: COLORS.muted, width: width - 32, height: 48 });
    addList(card, "\u5F37\u3044\u70B9", result.strengths, 16, 194, width - 32);
    addList(card, "\u6C17\u306B\u306A\u308B\u70B9", result.concerns, 16, 308, width - 32);
  }
  function renderCompareContent(parent2, result, x, y, width, demoComparison) {
    const card = createCard(x, y, width, 500);
    parent2.appendChild(card);
    addText(card, "\u6BD4\u8F03\u30FB\u8A55\u4FA1", 16, 14, { size: 16, bold: true, color: COLORS.blue });
    if (!result) {
      if (demoComparison) {
        addText(card, demoComparison.summary, 16, 46, { size: 10, width: width - 32, height: 54 });
        addText(card, `Primary: ${demoComparison.primaryName}`, 16, 112, { size: 12, bold: true, color: COLORS.green, width: width - 32 });
        addText(card, `Secondary: ${demoComparison.secondaryName}`, 16, 138, { size: 10, color: COLORS.muted, width: width - 32 });
        addText(card, `\u9078\u5B9A\u7406\u7531: ${demoComparison.selectionReason}`, 16, 166, { size: 9, color: COLORS.muted, width: width - 32, height: 42 });
        demoComparison.rows.slice(0, 5).forEach((row, index) => {
          const yPos = 236 + index * 48;
          addText(card, row.name, 16, yPos, { size: 9, bold: true, color: COLORS.blue, width: 120 });
          addText(card, row.role, 146, yPos, { size: 8, width: 92 });
          addText(card, row.layout, 250, yPos, { size: 8, color: COLORS.muted, width: 132 });
          addText(card, row.strength, 398, yPos, { size: 8, color: COLORS.muted, width: width - 414, height: 30 });
        });
        return;
      }
      addText(card, "\u6BD4\u8F03\u7D50\u679C\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u30022\u304B\u30895\u6848\u3092\u9078\u629E\u3057\u3066\u6BD4\u8F03\u3059\u308B\u3068\u3001\u3053\u3053\u306B\u8A18\u9332\u3055\u308C\u307E\u3059\u3002", 16, 48, {
        size: 11,
        color: COLORS.muted,
        width: width - 32
      });
      return;
    }
    addText(card, result.comparisonSummary, 16, 46, { size: 10, width: width - 32, height: 46 });
    addText(card, `Primary: ${findFrameName(result, result.recommendation.primaryFrameId)}`, 16, 106, {
      size: 12,
      bold: true,
      color: COLORS.green,
      width: width - 32
    });
    addText(card, `Secondary: ${result.recommendation.secondaryFrameId ? findFrameName(result, result.recommendation.secondaryFrameId) : "\u306A\u3057"}`, 16, 132, {
      size: 10,
      color: COLORS.muted,
      width: width - 32
    });
    addText(card, `\u9078\u5B9A\u7406\u7531: ${result.recommendation.primaryReason}`, 16, 162, { size: 9, color: COLORS.muted, width: width - 32, height: 46 });
    result.frameRoles.slice(0, 4).forEach((role, index) => {
      const yPos = 238 + index * 54;
      addText(card, role.frameName, 16, yPos, { size: 9, bold: true, color: COLORS.blue, width: 156 });
      addText(card, role.role, 184, yPos, { size: 8, width: 132 });
      addText(card, role.strength, 330, yPos, { size: 8, color: COLORS.muted, width: width - 350, height: 32 });
    });
  }
  function renderFinishContent(parent2, result, comparison, x, y, width) {
    var _a;
    const brief = (_a = result == null ? void 0 : result.brief) != null ? _a : comparison == null ? void 0 : comparison.backgroundBrief;
    const card = createCard(x, y, width, 420);
    parent2.appendChild(card);
    addText(card, "\u4ED5\u4E0A\u3052", 16, 14, { size: 16, bold: true, color: COLORS.blue });
    if (!brief) {
      addText(card, "\u4ED5\u4E0A\u3052\u7D50\u679C\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002\u6BD4\u8F03\u304B\u3089background brief\u3092\u4F5C\u308B\u3068\u3001\u3053\u3053\u306B\u8A18\u9332\u3055\u308C\u307E\u3059\u3002", 16, 48, {
        size: 11,
        color: COLORS.muted,
        width: width - 32
      });
      return;
    }
    addText(card, `\u5BFE\u8C61: ${brief.targetFrameName}`, 16, 46, { size: 11, bold: true, width: width - 32 });
    addText(card, brief.promptText, 16, 72, { size: 10, width: width - 32, height: 58 });
    addText(card, `\u80CC\u666F\u30B9\u30BF\u30A4\u30EB: ${brief.mood} / ${brief.style}`, 16, 140, { size: 9, color: COLORS.muted, width: width - 32 });
    addList(card, "\u907F\u3051\u308B\u3053\u3068", brief.avoid, 16, 180, width - 32);
    addPreviewBox(card, 16, 306, result ? `\u6700\u7D42\u6848 / ${result.styleName}` : "\u80CC\u666F\u751F\u6210\u5F8C\u306B\u78BA\u8A8D", width - 32, 78);
  }
  function addStageStats(parent2, stats) {
    stats.forEach(([label, value], index) => {
      const card = createFrame(`Stat / ${label}`, 24 + index * 154, 82, 138, 44, COLORS.paleBlue);
      card.cornerRadius = 12;
      card.strokes = [{ type: "SOLID", color: COLORS.border }];
      card.strokeWeight = 1;
      parent2.appendChild(card);
      addText(card, label, 12, 8, { size: 8, bold: true, color: COLORS.blue, width: 114 });
      addText(card, value, 12, 22, { size: 11, bold: true, width: 114 });
    });
  }
  function appendSvg(parent2, svg, x, y, width, height, name) {
    const preview = createFrame(`Preview / ${name}`, x, y, width, height, COLORS.board);
    preview.cornerRadius = 8;
    preview.strokes = [{ type: "SOLID", color: COLORS.border }];
    preview.strokeWeight = 1;
    preview.clipsContent = true;
    parent2.appendChild(preview);
    const svgNode = figma.createNodeFromSvg(svg);
    svgNode.name = name;
    const originalWidth = Math.max(svgNode.width, 1);
    const originalHeight = Math.max(svgNode.height, 1);
    const scale = Math.min(width / originalWidth, height / originalHeight);
    const scalableNode = svgNode;
    if (typeof scalableNode.rescale === "function") {
      scalableNode.rescale(scale);
    } else {
      svgNode.resize(originalWidth * scale, originalHeight * scale);
    }
    svgNode.x = (width - svgNode.width) / 2;
    svgNode.y = (height - svgNode.height) / 2;
    preview.appendChild(svgNode);
  }
  function createStandaloneBoard(title, description, width, height) {
    const board = createFrame(title, 0, 0, width, height, COLORS.board);
    board.cornerRadius = 18;
    board.strokes = [{ type: "SOLID", color: COLORS.border }];
    board.strokeWeight = 1;
    addText(board, title, 32, 30, { size: 24, bold: true, width: width - 64 });
    addText(board, description, 32, 66, { size: 12, color: COLORS.muted, width: width - 64 });
    return board;
  }
  function createSection(title, description, x, y, width, height) {
    const section = createFrame(title, x, y, width, height, COLORS.board);
    section.cornerRadius = 18;
    section.strokes = [{ type: "SOLID", color: COLORS.border }];
    section.strokeWeight = 1;
    addText(section, title, 24, 20, { size: 22, bold: true, width: width - 48 });
    addText(section, description, 24, 54, { size: 11, color: COLORS.muted, width: width - 48 });
    return section;
  }
  function createFrame(name, x, y, width, height, fill) {
    const frame = figma.createFrame();
    frame.name = name;
    frame.x = x;
    frame.y = y;
    frame.resize(width, height);
    frame.fills = [{ type: "SOLID", color: fill }];
    frame.clipsContent = false;
    return frame;
  }
  function appendBoard(parent2, board) {
    if (parent2) {
      parent2.appendChild(board);
      return;
    }
    figma.currentPage.appendChild(board);
  }
  function createCard(x, y, width, height) {
    const card = createFrame("Card", x, y, width, height, COLORS.card);
    card.cornerRadius = 12;
    card.strokes = [{ type: "SOLID", color: COLORS.border }];
    card.strokeWeight = 1;
    return card;
  }
  function addMetric(parent2, label, value, x, y, width) {
    addText(parent2, label, x, y, { size: 10, color: COLORS.blue, bold: true, width });
    addText(parent2, value || "\u672A\u6307\u5B9A", x, y + 18, { size: 12, width, height: 34 });
  }
  function addList(parent2, title, items, x, y, width) {
    addText(parent2, title, x, y, { size: 10, bold: true, color: COLORS.blue, width });
    const visible = items.length > 0 ? items.slice(0, 4) : ["\u9805\u76EE\u306F\u3042\u308A\u307E\u305B\u3093\u3002"];
    visible.forEach((item, index) => addText(parent2, `- ${item}`, x, y + 20 + index * 24, { size: 9, color: COLORS.muted, width, height: 22 }));
  }
  function addEmpty(parent2, message, x, y, width) {
    const card = createCard(x, y, width, 120);
    parent2.appendChild(card);
    addText(card, "\u307E\u3060\u51FA\u529B\u306F\u3042\u308A\u307E\u305B\u3093", 16, 22, { size: 15, bold: true, width: width - 32 });
    addText(card, message, 16, 52, { size: 11, color: COLORS.muted, width: width - 32 });
  }
  function addPreviewBox(parent2, x, y, label, width = 300, height = 110) {
    const box = createFrame(label, x, y, width, height, COLORS.paleBlue);
    box.cornerRadius = 10;
    box.strokes = [{ type: "SOLID", color: COLORS.border }];
    box.strokeWeight = 1;
    parent2.appendChild(box);
    addText(box, label, 20, Math.max(22, height / 2 - 8), { size: 13, bold: true, color: COLORS.blue, width: width - 40 });
  }
  function addPill(parent2, x, y, text, fill, width = 160, textColor = { r: 1, g: 1, b: 1 }) {
    const pill = figma.createFrame();
    pill.name = `Pill / ${text}`;
    pill.x = x;
    pill.y = y;
    pill.resize(width, 28);
    pill.cornerRadius = 14;
    pill.fills = [{ type: "SOLID", color: fill }];
    parent2.appendChild(pill);
    addText(pill, text, 12, 7, { size: 10, color: textColor, bold: true, width: width - 24, height: 14 });
  }
  function addText(parent2, characters, x, y, options = {}) {
    var _a, _b, _c;
    const node = figma.createText();
    node.name = options.bold ? "Text / Bold" : "Text";
    node.fontName = options.bold ? FONT_BOLD : FONT_REGULAR;
    node.fontSize = (_a = options.size) != null ? _a : 12;
    node.fills = [{ type: "SOLID", color: (_b = options.color) != null ? _b : COLORS.text }];
    node.characters = characters;
    node.x = x;
    node.y = y;
    if (options.width) {
      node.resize(options.width, (_c = options.height) != null ? _c : Math.max(20, node.height));
      node.textAutoResize = "HEIGHT";
    }
    parent2.appendChild(node);
    return node;
  }
  async function loadFonts() {
    await Promise.all([figma.loadFontAsync(FONT_REGULAR), figma.loadFontAsync(FONT_BOLD)]);
  }
  function placeStandalone(board) {
    board.x = figma.viewport.center.x - board.width / 2;
    board.y = figma.viewport.center.y - board.height / 2;
    figma.currentPage.appendChild(board);
    figma.currentPage.selection = [board];
    figma.viewport.scrollAndZoomIntoView([board]);
  }
  function findFrameName(result, frameId) {
    var _a, _b;
    return (_b = (_a = result.frames.find((frame) => frame.id === frameId)) == null ? void 0 : _a.name) != null ? _b : frameId;
  }

  // src/plugin/code.ts
  var PROCESS_LAYOUT = {
    baseXOffset: -3800,
    baseYOffset: -760,
    bannersY: 1140,
    candidateGap: 80
  };
  figma.showUI(__html__, {
    width: appConfig.uiWidth,
    height: appConfig.uiHeight
  });
  figma.ui.onmessage = async (rawMessage) => {
    const message = parsePluginRequestMessage(rawMessage);
    if (!message) {
      postToUi({ type: "PLUGIN_ERROR", payload: { message: "Unsupported plugin message." } });
      return;
    }
    try {
      if (message.type === "RESIZE_UI") {
        figma.ui.resize(message.payload.width, message.payload.height);
        return;
      }
      if (message.type === "LOAD_API_SETTINGS") {
        const settings = await figma.clientStorage.getAsync(RUNTIME_API_SETTINGS_STORAGE_KEY);
        postToUi({ type: "API_SETTINGS_LOADED", payload: { settings } });
        return;
      }
      if (message.type === "SAVE_API_SETTINGS") {
        await figma.clientStorage.setAsync(RUNTIME_API_SETTINGS_STORAGE_KEY, message.payload);
        postToUi({ type: "API_SETTINGS_SAVED", payload: { saved: true } });
        return;
      }
      if (message.type === "TEST_API_SETTINGS") {
        const hasDify = Object.values(message.payload.dify).some((workflow) => workflow.url.trim() && workflow.apiKey.trim());
        const hasGemini = message.payload.gemini.apiKey.trim().length > 0;
        postToUi({
          type: "API_SETTINGS_TEST_RESULT",
          payload: {
            ok: hasDify || hasGemini,
            message: hasDify || hasGemini ? "\u4FDD\u5B58\u6E08\u307F\u8A2D\u5B9A\u3092\u78BA\u8A8D\u3057\u307E\u3057\u305F\u3002Live Mode\u3078\u5207\u308A\u66FF\u3048\u308B\u6E96\u5099\u304C\u3042\u308A\u307E\u3059\u3002" : "API\u8A2D\u5B9A\u304C\u672A\u5B8C\u4E86\u3067\u3059\u3002Dify\u307E\u305F\u306FGemini\u306EURL / Key\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002"
          }
        });
        return;
      }
      if (message.type === "INSERT_SVG") {
        createSvgNode(message.payload.svg, message.payload.name);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "SVG\u3092Figma\u306B\u914D\u7F6E\u3057\u307E\u3057\u305F\u3002" } });
        return;
      }
      if (message.type === "INSERT_SVG_BATCH") {
        const nodes = placeSvgCandidates(message.payload.items, message.payload.x !== void 0 && message.payload.y !== void 0 ? { x: message.payload.x, y: message.payload.y } : void 0);
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: `${message.payload.items.length}\u6848\u3092Figma\u306B\u914D\u7F6E\u3057\u307E\u3057\u305F\u3002` } });
        return;
      }
      if (message.type === "PLACE_EXPLORE_PACKAGE") {
        const { startX, startY } = getProcessBase();
        const boards = [];
        boards.push(await renderProcessStageBoard(message.payload, "project_header", { x: startX, y: startY, zoom: false }));
        await sleep(350);
        boards.push(await renderProcessStageBoard(message.payload, "ideas", __spreadProps(__spreadValues({}, getStagePosition("ideas", startX, startY)), { zoom: false })));
        await sleep(500);
        boards.push(await renderProcessStageBoard(message.payload, "typography_drafts", __spreadProps(__spreadValues({}, getStagePosition("typography_drafts", startX, startY)), { zoom: false })));
        await sleep(500);
        boards.push(await renderProcessStageBoard(message.payload, "refined_svgs", __spreadProps(__spreadValues({}, getStagePosition("refined_svgs", startX, startY)), { zoom: false })));
        await sleep(350);
        boards.push(await renderProcessStageBoard(message.payload, "compare", __spreadProps(__spreadValues({}, getStagePosition("compare", startX, startY)), { zoom: false })));
        boards.push(await renderProcessStageBoard(message.payload, "background_variations", __spreadProps(__spreadValues({}, getStagePosition("background_variations", startX, startY)), { zoom: false })));
        boards.push(await renderProcessStageBoard(message.payload, "final_candidate", __spreadProps(__spreadValues({}, getStagePosition("final_candidate", startX, startY)), { zoom: false })));
        const nodes = placeProjectCandidates(message.payload, getArtifactPosition(startX, startY));
        const finalNodes = placeFinalCandidate(message.payload, getFinalArtifactPosition(startX, startY));
        figma.currentPage.selection = [...boards, ...nodes, ...finalNodes];
        figma.viewport.scrollAndZoomIntoView([...boards, ...nodes, ...finalNodes]);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: `${nodes.length}\u6848\u3068\u5DE5\u7A0B\u5225\u30DC\u30FC\u30C9\u3092Figma\u306B\u914D\u7F6E\u3057\u307E\u3057\u305F\u3002` } });
        return;
      }
      if (message.type === "RENDER_PROCESS_BOARD") {
        const { startX, startY } = getProcessBase();
        const boards = await renderProcessBoard(message.payload, { x: startX, y: startY, zoom: false });
        const nodes = placeProjectCandidates(message.payload, getArtifactPosition(startX, startY));
        const finalNodes = placeFinalCandidate(message.payload, getFinalArtifactPosition(startX, startY));
        figma.currentPage.selection = [...boards, ...nodes, ...finalNodes];
        figma.viewport.scrollAndZoomIntoView([...boards, ...nodes, ...finalNodes]);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u5DE5\u7A0B\u5225\u30DC\u30FC\u30C9\u3092Figma\u306B\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002" } });
        return;
      }
      if (message.type === "RENDER_PROCESS_STAGE_BOARD") {
        const board = await renderProcessStageBoard(message.payload.project, message.payload.stage, {
          x: message.payload.x,
          y: message.payload.y,
          zoom: message.payload.zoom
        });
        const { startX, startY } = getProcessBase();
        const artifactNodes = message.payload.stage === "refined_svgs" ? placeProjectCandidates(message.payload.project, getArtifactPosition(startX, startY)) : message.payload.stage === "final_candidate" ? placeFinalCandidate(message.payload.project, getFinalArtifactPosition(startX, startY)) : [];
        if (artifactNodes.length > 0) {
          figma.currentPage.selection = [board, ...artifactNodes];
          figma.viewport.scrollAndZoomIntoView([board, ...artifactNodes]);
        }
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u5DE5\u7A0B\u30DC\u30FC\u30C9\u3092Figma\u306B\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002" } });
        return;
      }
      if (message.type === "RENDER_DIAGNOSIS_BOARD") {
        await renderStandaloneDiagnosisBoard(message.payload);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u8A3A\u65AD\u7D50\u679C\u3092Figma\u306B\u8A18\u9332\u3057\u307E\u3057\u305F\u3002" } });
        return;
      }
      if (message.type === "RENDER_COMPARE_BOARD") {
        await renderStandaloneCompareBoard(message.payload);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u6BD4\u8F03\u7D50\u679C\u3092Figma\u306B\u8A18\u9332\u3057\u307E\u3057\u305F\u3002" } });
        return;
      }
      if (message.type === "RENDER_FINISH_BOARD") {
        await renderStandaloneFinishBoard(message.payload.backgroundResult, message.payload.comparisonResult);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u4ED5\u4E0A\u3052\u7D50\u679C\u3092Figma\u306B\u8A18\u9332\u3057\u307E\u3057\u305F\u3002" } });
        return;
      }
      if (message.type === "REQUEST_SELECTED_FRAME") {
        postToUi({ type: "SELECTION_FRAME_RESULT", payload: extractFrameData() });
        return;
      }
      if (message.type === "REQUEST_SELECTED_FRAMES") {
        postToUi({ type: "SELECTION_FRAMES_RESULT", payload: extractMultiFrameData() });
        return;
      }
      if (message.type === "APPLY_BACKGROUND") {
        insertBackgroundImage(message.payload.targetFrameId, message.payload.backgroundResult);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u80CC\u666F\u30EC\u30A4\u30E4\u30FC\u3092\u9069\u7528\u3057\u307E\u3057\u305F\u3002" } });
      }
    } catch (error) {
      postToUi({ type: "PLUGIN_ERROR", payload: { message: getErrorMessage(error) } });
    }
  };
  function placeProjectCandidates(project, position) {
    return placeSvgCandidates(
      project.svgCandidates.map((candidate) => ({ svg: candidate.svg, name: candidate.name })),
      position
    );
  }
  function placeSvgCandidates(items, position) {
    var _a, _b;
    const startX = (_a = position == null ? void 0 : position.x) != null ? _a : figma.viewport.center.x + PROCESS_LAYOUT.baseXOffset;
    const startY = (_b = position == null ? void 0 : position.y) != null ? _b : figma.viewport.center.y + PROCESS_LAYOUT.baseYOffset + PROCESS_LAYOUT.bannersY;
    return items.map(
      (item, index) => createSvgNode(item.svg, item.name, {
        x: startX + index * (800 + PROCESS_LAYOUT.candidateGap),
        y: startY,
        select: false,
        zoom: false
      })
    );
  }
  function placeFinalCandidate(project, position) {
    var _a, _b, _c;
    const finalCandidateId = (_b = (_a = project.stageWorkflow) == null ? void 0 : _a.finalCandidate) == null ? void 0 : _b.refinedCandidateId;
    const candidate = (_c = project.svgCandidates.find((item) => item.id === finalCandidateId)) != null ? _c : project.svgCandidates[0];
    if (!candidate) return [];
    return [
      createSvgNode(candidate.svg, `FINAL_${candidate.name}`, {
        x: position.x,
        y: position.y,
        select: false,
        zoom: false
      })
    ];
  }
  function getProcessBase() {
    return {
      startX: figma.viewport.center.x + PROCESS_LAYOUT.baseXOffset,
      startY: figma.viewport.center.y + PROCESS_LAYOUT.baseYOffset
    };
  }
  function getStagePosition(stage, startX, startY) {
    const position = PROCESS_STAGE_POSITIONS[stage];
    return { x: startX + position.x, y: startY + position.y };
  }
  function getArtifactPosition(startX, startY) {
    return { x: startX, y: startY + PROCESS_LAYOUT.bannersY };
  }
  function getFinalArtifactPosition(startX, startY) {
    return {
      x: startX + PROCESS_STAGE_POSITIONS.final_candidate.x,
      y: startY + PROCESS_LAYOUT.bannersY
    };
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
})();
