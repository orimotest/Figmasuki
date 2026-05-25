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
    name: "AI Creative Assistant",
    uiWidth: 960,
    uiHeight: 720
  };

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
    if (value.type === "REQUEST_SELECTED_FRAME" || value.type === "REQUEST_SELECTED_FRAMES") {
      return { type: value.type };
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
          items: value.payload.items.filter((item) => isRecord(item) && hasString(item, "svg")).map((item) => ({ svg: item.svg, name: typeof item.name === "string" ? item.name : void 0 }))
        }
      };
    }
    if (value.type === "PLACE_EXPLORE_PACKAGE" && isRecord(value.payload)) {
      return { type: "PLACE_EXPLORE_PACKAGE", payload: value.payload };
    }
    if (value.type === "RENDER_PROCESS_BOARD" && isRecord(value.payload)) {
      return { type: "RENDER_PROCESS_BOARD", payload: value.payload };
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
  function getErrorMessage(error) {
    return error instanceof Error ? error.message : "Unexpected plugin error.";
  }

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
  async function renderProcessBoard(project, options = {}) {
    var _a, _b;
    await loadFonts();
    const root = createFrame(`AI Cover Studio / Process Board / ${project.projectName}`, 0, 0, 1840, 1720, COLORS.canvas);
    root.cornerRadius = 28;
    root.strokes = [{ type: "SOLID", color: COLORS.border }];
    root.strokeWeight = 1;
    root.x = (_a = options.x) != null ? _a : figma.viewport.center.x - 920;
    root.y = (_b = options.y) != null ? _b : figma.viewport.center.y - 760;
    renderHeader(root, project);
    renderCopySection(root, project.copyDirections);
    renderLayoutSection(root, project);
    renderExplorationSection(root, project.copyDirections);
    renderInsightSection(root, project);
    figma.currentPage.appendChild(root);
    if (options.zoom !== false) {
      figma.currentPage.selection = [root];
      figma.viewport.scrollAndZoomIntoView([root]);
    }
    return root;
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
  function renderHeader(parent2, project) {
    var _a, _b;
    addText(parent2, "AI Cover Studio / Process Board", 40, 34, { size: 30, bold: true, width: 900 });
    addText(parent2, "AI\u304C\u63A2\u7D22\u3057\u305F\u30B3\u30D4\u30FC\u3001\u30EC\u30A4\u30A2\u30A6\u30C8\u65B9\u91DD\u3001\u8A3A\u65AD\u3001\u6BD4\u8F03\u3001\u4ED5\u4E0A\u3052\u5224\u65AD\u3092\u307E\u3068\u3081\u305F\u30EC\u30D3\u30E5\u30FC\u7528\u30DC\u30FC\u30C9\u3067\u3059\u3002", 40, 76, {
      size: 14,
      color: COLORS.muted,
      width: 1160
    });
    addPill(parent2, 1548, 42, project.providerMeta.mode.includes("Demo") ? "Demo Mode" : "Live / Mixed", COLORS.blue, 220);
    const info = createCard(40, 126, 1760, 148);
    parent2.appendChild(info);
    addMetric(info, "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u540D", project.projectName, 24, 22, 360);
    addMetric(info, "\u7528\u9014", project.contentType === "seminar_banner" ? "\u30BB\u30DF\u30CA\u30FC / \u30A6\u30A7\u30D3\u30CA\u30FC\u30D0\u30CA\u30FC" : "note / \u30D6\u30ED\u30B0\u30B5\u30E0\u30CD\u30A4\u30EB", 420, 22, 300);
    addMetric(info, "\u30B5\u30A4\u30BA", `${project.canvasSize.width} x ${project.canvasSize.height}`, 760, 22, 220);
    addMetric(info, "\u5165\u529B\u30BF\u30A4\u30D7", project.inputMode === "fixed_copy" ? "\u78BA\u5B9A\u30B3\u30D4\u30FC\u304B\u3089\u4F5C\u308B" : "\u8981\u4EF6\u304B\u3089\u4F5C\u308B", 1020, 22, 240);
    addMetric(info, "\u4F5C\u6210\u65E5\u6642", new Date(project.createdAt).toLocaleString("ja-JP"), 1300, 22, 360);
    addMetric(info, "\u30BF\u30FC\u30B2\u30C3\u30C8", (_a = project.inputSummary.targetAudience) != null ? _a : "\u672A\u6307\u5B9A", 24, 88, 520);
    addMetric(info, "\u30B4\u30FC\u30EB", (_b = project.inputSummary.goal) != null ? _b : "\u672A\u6307\u5B9A", 580, 88, 520);
    addMetric(info, "\u5165\u529B\u5185\u5BB9", project.inputSummary.brief, 1140, 88, 580);
  }
  function renderCopySection(parent2, directions) {
    const section = createSection("5\u65B9\u5411\u306B\u6574\u7406", "30\u6848\u306E\u63A2\u7D22\u304B\u3089\u3001\u4EBA\u304C\u9078\u3073\u3084\u3059\u30445\u3064\u306E\u30B3\u30D4\u30FC\u65B9\u5411\u6027\u3078\u6574\u7406\u3057\u307E\u3059\u3002", 40, 314, 560, 760);
    parent2.appendChild(section);
    renderCopyCards(section, directions, 20, 78, 520);
  }
  function renderLayoutSection(parent2, project) {
    const section = createSection("\u30EC\u30A4\u30A2\u30A6\u30C8\u65B9\u91DD", "\u5404\u65B9\u5411\u6027\u306B\u5BFE\u5FDC\u3059\u308B\u69CB\u56F3\u3001\u512A\u5148\u9806\u4F4D\u3001\u80CC\u666F\u65B9\u91DD\u3092\u6574\u7406\u3057\u307E\u3059\u3002", 640, 314, 560, 760);
    parent2.appendChild(section);
    renderLayoutCards(section, project, 20, 78, 520);
  }
  function renderExplorationSection(parent2, directions) {
    const section = createSection("30\u6848\u3092\u63A2\u7D22", "\u30B3\u30D4\u30FC\u3068\u8A34\u6C42\u8EF8\u3092\u5E83\u3052\u308B\u30C7\u30E2\u63A2\u7D22\u30ED\u30B0\u3067\u3059\u3002SVG\u672C\u4F53\u306F\u30DC\u30FC\u30C9\u5916\u306B5\u6848\u3068\u3057\u3066\u914D\u7F6E\u3057\u307E\u3059\u3002", 1240, 314, 560, 760);
    parent2.appendChild(section);
    const summary = createCard(20, 78, 520, 86);
    section.appendChild(summary);
    addText(summary, "30\u6848 \u2192 5\u65B9\u5411\u3078\u62BD\u51FA", 18, 14, { size: 18, bold: true, color: COLORS.blue, width: 300 });
    addText(summary, "Demo Mode\u3067\u3082\u3001AI\u304C\u3044\u304D\u306A\u308A5\u6848\u3092\u51FA\u3057\u305F\u306E\u3067\u306F\u306A\u304F\u3001\u8907\u6570\u306E\u5207\u308A\u53E3\u3092\u5E83\u3052\u3066\u304B\u3089\u65B9\u5411\u6027\u3092\u7D5E\u3063\u305F\u6D41\u308C\u3068\u3057\u3066\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002", 18, 44, {
      size: 10,
      color: COLORS.muted,
      width: 484,
      height: 34
    });
    const ideas = createExplorationIdeas(directions);
    if (ideas.length === 0) {
      addEmpty(section, "Demo\u30B5\u30F3\u30D7\u30EB\u3092\u8AAD\u307F\u8FBC\u3080\u304B\u3001\u63A2\u7D22\u3092\u958B\u59CB\u3059\u308B\u306830\u6848\u306E\u63A2\u7D22\u30ED\u30B0\u304C\u8868\u793A\u3055\u308C\u307E\u3059\u3002", 20, 188, 520);
      return;
    }
    ideas.slice(0, 30).forEach((idea, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      const cardWidth = 160;
      const card = createFrame(`Idea ${index + 1}`, 20 + col * 180, 190 + row * 54, cardWidth, 44, index % 2 === 0 ? COLORS.card : COLORS.paleBlue);
      card.cornerRadius = 10;
      card.strokes = [{ type: "SOLID", color: COLORS.border }];
      card.strokeWeight = 1;
      section.appendChild(card);
      addText(card, `${String(index + 1).padStart(2, "0")} ${idea.directionTitle.slice(0, 7)} / ${idea.angle}`, 10, 8, {
        size: 8,
        bold: true,
        color: COLORS.blue,
        width: cardWidth - 20
      });
      addText(card, idea.copy, 10, 24, { size: 8, color: COLORS.muted, width: cardWidth - 20, height: 14 });
    });
    addText(section, "\u62BD\u51FA\u3055\u308C\u305F5\u65B9\u5411", 20, 736, { size: 10, bold: true, color: COLORS.blue, width: 140 });
    directions.slice(0, 5).forEach((direction, index) => {
      addPill(section, 132 + index * 82, 730, direction.title.slice(0, 7), COLORS.blue, 74);
    });
  }
  function renderInsightSection(parent2, project) {
    const section = createSection("\u30EC\u30D3\u30E5\u30FC\u8A18\u9332", "\u8A3A\u65AD\u3001\u6BD4\u8F03\u3001\u4ED5\u4E0A\u3052\u306E\u7D50\u679C\u304C\u3042\u308B\u5834\u5408\u306F\u3053\u3053\u306B\u8FFD\u8A18\u3055\u308C\u307E\u3059\u3002", 40, 1118, 1760, 548);
    parent2.appendChild(section);
    renderDiagnosisContent(section, project.diagnosisResults, 24, 82, 520);
    renderCompareContent(section, project.comparisonResult, 620, 82, 520);
    renderFinishContent(section, project.backgroundResult, project.comparisonResult, 1216, 82, 520);
  }
  function renderCopyCards(parent2, directions, x, y, width) {
    if (directions.length === 0) {
      addEmpty(parent2, "\u30B3\u30D4\u30FC\u65B9\u5411\u6027\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002Demo\u30B5\u30F3\u30D7\u30EB\u3092\u8AAD\u307F\u8FBC\u3080\u304B\u3001\u63A2\u7D22\u3092\u958B\u59CB\u3057\u3066\u304F\u3060\u3055\u3044\u3002", x, y, width);
      return;
    }
    directions.slice(0, 5).forEach((direction, index) => {
      const card = createCard(x, y + index * 126, width, 112);
      parent2.appendChild(card);
      addText(card, `${index + 1}. ${direction.title}`, 16, 12, { size: 14, bold: true, width: width - 32 });
      addText(card, direction.copy.main.replace(/\n/g, " / "), 16, 34, { size: 12, bold: true, color: COLORS.blue, width: width - 32 });
      addText(card, direction.copy.sub, 16, 56, { size: 10, color: COLORS.muted, width: width - 32, height: 24 });
      addText(card, `\u610F\u56F3: ${direction.intent}`, 16, 82, { size: 9, color: COLORS.muted, width: width - 32 });
      if (direction.copy.cta) addPill(card, width - 146, 12, direction.copy.cta, COLORS.green, 126);
    });
  }
  function renderLayoutCards(parent2, project, x, y, width) {
    if (project.layoutStrategies.length === 0) {
      addEmpty(parent2, "\u30EC\u30A4\u30A2\u30A6\u30C8\u65B9\u91DD\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002Demo\u30B5\u30F3\u30D7\u30EB\u3092\u8AAD\u307F\u8FBC\u3080\u304B\u3001\u63A2\u7D22\u3092\u958B\u59CB\u3057\u3066\u304F\u3060\u3055\u3044\u3002", x, y, width);
      return;
    }
    project.layoutStrategies.slice(0, 5).forEach((strategy, index) => {
      const card = createCard(x, y + index * 126, width, 112);
      parent2.appendChild(card);
      addText(card, `${index + 1}. ${strategy.directionName}`, 16, 12, { size: 14, bold: true, width: 260 });
      addPill(card, width - 156, 10, strategy.layoutType, COLORS.blue, 136);
      addText(card, `\u69CB\u56F3: ${strategy.composition}`, 16, 38, { size: 10, width: width - 32, height: 30 });
      addText(card, `\u512A\u5148\u9806\u4F4D: ${strategy.hierarchy.join(" > ")}`, 16, 70, { size: 9, color: COLORS.muted, width: width - 32 });
      addText(card, `\u80CC\u666F: ${strategy.background}`, 16, 90, { size: 9, color: COLORS.muted, width: width - 32 });
    });
  }
  function renderDiagnosisContent(parent2, results, x, y, width) {
    const result = results[results.length - 1];
    const card = createCard(x, y, width, 420);
    parent2.appendChild(card);
    addText(card, "\u8A3A\u65AD", 16, 14, { size: 16, bold: true, color: COLORS.blue });
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
    addList(card, "\u5F37\u3044\u70B9", result.strengths, 16, 184, width - 32);
    addList(card, "\u6C17\u306B\u306A\u308B\u70B9", result.concerns, 16, 282, width - 32);
  }
  function renderCompareContent(parent2, result, x, y, width) {
    const card = createCard(x, y, width, 420);
    parent2.appendChild(card);
    addText(card, "\u6BD4\u8F03", 16, 14, { size: 16, bold: true, color: COLORS.blue });
    if (!result) {
      addText(card, "\u6BD4\u8F03\u7D50\u679C\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u30022\u304B\u30895\u6848\u3092\u9078\u629E\u3057\u3066\u6BD4\u8F03\u3059\u308B\u3068\u3001\u3053\u3053\u306B\u8A18\u9332\u3055\u308C\u307E\u3059\u3002", 16, 48, {
        size: 11,
        color: COLORS.muted,
        width: width - 32
      });
      return;
    }
    addText(card, result.comparisonSummary, 16, 46, { size: 10, width: width - 32, height: 48 });
    addText(card, `\u30D9\u30FC\u30B9\u5019\u88DC: ${findFrameName(result, result.recommendation.primaryFrameId)}`, 16, 104, {
      size: 11,
      bold: true,
      color: COLORS.green,
      width: width - 32
    });
    addText(card, `\u6B21\u70B9\u5019\u88DC: ${result.recommendation.secondaryFrameId ? findFrameName(result, result.recommendation.secondaryFrameId) : "\u306A\u3057"}`, 16, 128, {
      size: 10,
      color: COLORS.muted,
      width: width - 32
    });
    addText(card, `\u9078\u5B9A\u7406\u7531: ${result.recommendation.primaryReason}`, 16, 154, { size: 9, color: COLORS.muted, width: width - 32, height: 46 });
    addList(
      card,
      "background brief",
      [
        result.backgroundBrief.promptText,
        `\u907F\u3051\u308B\u3053\u3068: ${result.backgroundBrief.avoid.join(", ")}`,
        `\u6587\u5B57\u9818\u57DF: ${result.backgroundBrief.safeAreaHint}`
      ],
      16,
      224,
      width - 32
    );
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
  function createExplorationIdeas(directions) {
    const fallbackAngles = ["\u554F\u3044", "\u4FA1\u5024", "\u5B9F\u52D9", "\u5B89\u5FC3", "\u4FE1\u983C", "CTA"];
    const demoAngles = {
      seminar_problem_01: [
        { angle: "\u4E0D\u5B89", copy: "AI\u6D3B\u7528\u3001\u4F55\u304B\u3089\u59CB\u3081\u308B\uFF1F" },
        { angle: "\u6700\u521D\u306E\u58C1", copy: "\u30C4\u30FC\u30EB\u9078\u3073\u3088\u308A\u5148\u306B\u77E5\u308B\u3053\u3068" },
        { angle: "\u5171\u611F", copy: "\u5FD9\u3057\u304F\u3066\u3082\u59CB\u3081\u3089\u308C\u308BAI\u5165\u9580" },
        { angle: "\u5C0E\u5165", copy: "\u660E\u65E5\u304B\u3089\u4F7F\u3048\u308B\u5B9F\u8DF5\u30B9\u30C6\u30C3\u30D7" },
        { angle: "\u5B89\u5FC3", copy: "\u5C02\u9580\u77E5\u8B58\u306A\u3057\u3067\u6700\u521D\u306E\u4E00\u6B69" },
        { angle: "CTA", copy: "\u7121\u6599\u3067\u53C2\u52A0\u3059\u308B" }
      ],
      seminar_benefit_02: [
        { angle: "\u6642\u77ED", copy: "60\u5206\u3067\u308F\u304B\u308BAI\u6D3B\u7528\u306E\u7B2C\u4E00\u6B69" },
        { angle: "\u6210\u679C", copy: "\u696D\u52D9\u6539\u5584\u306B\u4F7F\u3048\u308B\u8003\u3048\u65B9" },
        { angle: "\u7406\u89E3", copy: "\u5B9F\u4F8B\u3067\u308F\u304B\u308BAI\u6D3B\u7528" },
        { angle: "\u6574\u7406", copy: "\u8981\u70B9\u3060\u3051\u3092\u77ED\u6642\u9593\u3067\u5B66\u3076" },
        { angle: "\u5224\u65AD", copy: "\u53C2\u52A0\u5F8C\u306B\u4F55\u3092\u8A66\u3059\u304B\u898B\u3048\u308B" },
        { angle: "CTA", copy: "\u4ECA\u3059\u3050\u7533\u3057\u8FBC\u3080" }
      ],
      seminar_practical_03: [
        { angle: "\u5B9F\u52D9", copy: "\u660E\u65E5\u304B\u3089\u4F7F\u3048\u308BAI\u696D\u52D9\u6539\u5584" },
        { angle: "\u30D7\u30ED\u30F3\u30D7\u30C8", copy: "\u73FE\u5834\u3067\u8A66\u305B\u308B\u6D3B\u7528\u30B9\u30C6\u30C3\u30D7" },
        { angle: "\u5C0E\u5165", copy: "\u5C0F\u3055\u304F\u59CB\u3081\u308B\u696D\u52D9\u6539\u5584" },
        { angle: "\u5177\u4F53\u6027", copy: "\u5B9F\u4F8B\u3067\u5B66\u3076AI\u6D3B\u7528" },
        { angle: "\u6301\u3061\u5E30\u308A", copy: "\u3059\u3050\u8A66\u305B\u308B\u578B\u3092\u6574\u7406" },
        { angle: "CTA", copy: "\u7121\u6599\u3067\u8996\u8074\u3059\u308B" }
      ],
      seminar_trust_04: [
        { angle: "\u4FE1\u983C", copy: "\u73FE\u5834\u3067\u4F7F\u3048\u308BAI\u6D3B\u7528\u30BB\u30DF\u30CA\u30FC" },
        { angle: "BtoB", copy: "\u5C0E\u5165\u524D\u306E\u4E0D\u5B89\u3092\u6574\u7406\u3059\u308B" },
        { angle: "\u5171\u6709", copy: "\u793E\u5185\u3067\u8AAC\u660E\u3057\u3084\u3059\u3044AI\u5165\u9580" },
        { angle: "\u5805\u5B9F", copy: "\u5B9F\u8DF5\u307E\u3067\u3064\u306A\u3052\u308B\u57FA\u672C\u8A2D\u8A08" },
        { angle: "\u5B89\u5FC3", copy: "\u843D\u3061\u7740\u3044\u3066\u5B66\u3079\u308B\u5C0E\u5165\u8B1B\u5EA7" },
        { angle: "CTA", copy: "\u8A73\u7D30\u3092\u898B\u308B" }
      ],
      seminar_beginner_05: [
        { angle: "\u6B53\u8FCE", copy: "AI\u521D\u5FC3\u8005\u306E\u305F\u3081\u306E\u5B9F\u8DF5\u30A6\u30A7\u30D3\u30CA\u30FC" },
        { angle: "\u3084\u3055\u3057\u3055", copy: "\u5C02\u9580\u77E5\u8B58\u306A\u3057\u3067\u306F\u3058\u3081\u308B" },
        { angle: "\u5165\u53E3", copy: "\u6700\u521D\u306E\u4E00\u6B69\u3092\u4E00\u7DD2\u306B\u6574\u7406" },
        { angle: "\u4E0D\u5B89\u89E3\u6D88", copy: "\u96E3\u3057\u305D\u3046\u3092\u307B\u3069\u304F60\u5206" },
        { angle: "\u53C2\u52A0\u611F", copy: "\u521D\u5B66\u8005\u3067\u3082\u7F6E\u3044\u3066\u3044\u304B\u306A\u3044" },
        { angle: "CTA", copy: "\u7121\u6599\u3067\u53C2\u52A0\u3059\u308B" }
      ]
    };
    return directions.slice(0, 5).flatMap((direction, directionIndex) => {
      var _a;
      const ideas = (_a = demoAngles[direction.id]) != null ? _a : fallbackAngles.map((angle, index) => ({
        angle,
        copy: index === 0 ? direction.copy.main.replace(/\n/g, " ") : index === 1 ? direction.copy.sub : direction.intent
      }));
      return ideas.map((idea) => __spreadValues({ directionTitle: direction.title }, idea));
    });
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
    addText(section, title, 20, 18, { size: 20, bold: true, width: width - 40 });
    addText(section, description, 20, 48, { size: 11, color: COLORS.muted, width: width - 40 });
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
    const visible = items.length > 0 ? items.slice(0, 3) : ["\u9805\u76EE\u306F\u3042\u308A\u307E\u305B\u3093\u3002"];
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
      if (message.type === "INSERT_SVG") {
        createSvgNode(message.payload.svg, message.payload.name);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "SVG\u3092Figma\u306B\u914D\u7F6E\u3057\u307E\u3057\u305F\u3002" } });
        return;
      }
      if (message.type === "INSERT_SVG_BATCH") {
        const nodes = placeSvgCandidates(message.payload.items);
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: `${message.payload.items.length}\u6848\u3092\u6A2A\u4E26\u3073\u3067Figma\u306B\u914D\u7F6E\u3057\u307E\u3057\u305F\u3002` } });
        return;
      }
      if (message.type === "PLACE_EXPLORE_PACKAGE") {
        const nodes = placeProjectCandidates(message.payload);
        const board = await renderProcessBoard(message.payload, {
          x: figma.viewport.center.x - 900,
          y: figma.viewport.center.y + 360,
          zoom: false
        });
        figma.currentPage.selection = [...nodes, board];
        figma.viewport.scrollAndZoomIntoView([...nodes, board]);
        postToUi({
          type: "PLUGIN_SUCCESS",
          payload: { message: `${nodes.length}\u6848\u3068\u30D7\u30ED\u30BB\u30B9\u30DC\u30FC\u30C9\u3092Figma\u306B\u307E\u3068\u3081\u3066\u914D\u7F6E\u3057\u307E\u3057\u305F\u3002` }
        });
        return;
      }
      if (message.type === "RENDER_PROCESS_BOARD") {
        await renderProcessBoard(message.payload);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u30D7\u30ED\u30BB\u30B9\u30DC\u30FC\u30C9\u3092Figma\u306B\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002" } });
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
  function placeProjectCandidates(project) {
    return placeSvgCandidates(project.svgCandidates.map((candidate) => ({ svg: candidate.svg, name: candidate.name })));
  }
  function placeSvgCandidates(items) {
    const startX = figma.viewport.center.x - 400;
    const startY = figma.viewport.center.y - 225;
    return items.map(
      (item, index) => createSvgNode(item.svg, item.name, {
        x: startX + index * 900,
        y: startY,
        select: false,
        zoom: false
      })
    );
  }
})();
