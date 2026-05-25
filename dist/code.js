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
    canvas: { r: 0.957, g: 0.969, b: 0.984 },
    board: { r: 1, g: 1, b: 1 },
    card: { r: 0.984, g: 0.988, b: 0.996 },
    border: { r: 0.859, g: 0.886, b: 0.925 },
    text: { r: 0.086, g: 0.125, b: 0.2 },
    muted: { r: 0.392, g: 0.455, b: 0.545 },
    blue: { r: 0.082, g: 0.369, b: 0.937 },
    paleBlue: { r: 0.929, g: 0.961, b: 1 },
    green: { r: 0.086, g: 0.514, b: 0.278 }
  };
  var FONT_REGULAR = { family: "Inter", style: "Regular" };
  var FONT_BOLD = { family: "Inter", style: "Bold" };
  async function renderProcessBoard(project) {
    await loadFonts();
    const root = createFrame(`AI Process Board / ${project.projectName}`, 0, 0, 6720, 960, COLORS.canvas);
    const startX = figma.viewport.center.x - 360;
    const startY = figma.viewport.center.y - 260;
    root.x = startX;
    root.y = startY;
    const sections = [
      renderProjectBoard(project),
      renderCopyBoard(project.copyDirections, project),
      renderLayoutBoard(project),
      renderCandidateBoard(project.svgCandidates, project.copyDirections),
      renderDiagnosisBoard(project.diagnosisResults),
      renderCompareBoard(project.comparisonResult),
      renderFinishBoard(project.backgroundResult, project.comparisonResult)
    ];
    sections.forEach((section, index) => {
      section.x = 40 + index * 940;
      section.y = 40;
      root.appendChild(section);
    });
    figma.currentPage.appendChild(root);
    figma.currentPage.selection = [root];
    figma.viewport.scrollAndZoomIntoView([root]);
    return root;
  }
  async function renderStandaloneDiagnosisBoard(result) {
    await loadFonts();
    const board = renderDiagnosisBoard([result]);
    board.x = figma.viewport.center.x - 400;
    board.y = figma.viewport.center.y - 300;
    figma.currentPage.appendChild(board);
    figma.currentPage.selection = [board];
    figma.viewport.scrollAndZoomIntoView([board]);
    return board;
  }
  async function renderStandaloneCompareBoard(result) {
    await loadFonts();
    const board = renderCompareBoard(result);
    board.x = figma.viewport.center.x - 400;
    board.y = figma.viewport.center.y - 300;
    figma.currentPage.appendChild(board);
    figma.currentPage.selection = [board];
    figma.viewport.scrollAndZoomIntoView([board]);
    return board;
  }
  async function renderStandaloneFinishBoard(result, comparison) {
    await loadFonts();
    const board = renderFinishBoard(result, comparison);
    board.x = figma.viewport.center.x - 400;
    board.y = figma.viewport.center.y - 300;
    figma.currentPage.appendChild(board);
    figma.currentPage.selection = [board];
    figma.viewport.scrollAndZoomIntoView([board]);
    return board;
  }
  function renderProjectBoard(project) {
    var _a, _b;
    const board = createBoard("Project Header", "\u5165\u529B\u8981\u4EF6\u3068\u751F\u6210\u6761\u4EF6\u3092\u30EC\u30D3\u30E5\u30FC\u3059\u308B\u8D77\u70B9\u3067\u3059\u3002");
    let y = 112;
    y = addKeyValueCard(board, 28, y, "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u540D", project.projectName);
    y = addKeyValueCard(board, 28, y, "\u7528\u9014", project.contentType === "seminar_banner" ? "\u30BB\u30DF\u30CA\u30FC / \u30A6\u30A7\u30D3\u30CA\u30FC\u30D0\u30CA\u30FC" : "note / \u30D6\u30ED\u30B0\u30B5\u30E0\u30CD\u30A4\u30EB");
    y = addKeyValueCard(board, 28, y, "\u30B5\u30A4\u30BA", `${project.canvasSize.width} x ${project.canvasSize.height}`);
    y = addKeyValueCard(board, 28, y, "\u5165\u529B\u30BF\u30A4\u30D7", project.inputMode === "fixed_copy" ? "\u78BA\u5B9A\u30B3\u30D4\u30FC\u304B\u3089\u4F5C\u6210" : "\u8981\u4EF6\u304B\u3089\u4F5C\u6210");
    y = addKeyValueCard(board, 28, y, "\u8981\u4EF6\u8981\u7D04", project.inputSummary.brief);
    y = addKeyValueCard(board, 28, y, "\u30BF\u30FC\u30B2\u30C3\u30C8", (_a = project.inputSummary.targetAudience) != null ? _a : "\u672A\u6307\u5B9A");
    y = addKeyValueCard(board, 28, y, "\u30B4\u30FC\u30EB", (_b = project.inputSummary.goal) != null ? _b : "\u672A\u6307\u5B9A");
    y = addKeyValueCard(board, 28, y, "\u751F\u6210\u65E5\u6642", new Date(project.createdAt).toLocaleString("ja-JP"));
    addKeyValueCard(board, 28, y, "Provider", project.providerMeta.mode);
    return board;
  }
  function renderCopyBoard(directions, project) {
    const board = createBoard("Copy Exploration Board", `${(project == null ? void 0 : project.contentType) === "seminar_banner" ? "\u30BB\u30DF\u30CA\u30FC" : "note"}\u5411\u3051\u306B\u300130\u6848\u3092\u63A2\u7D22\u3057\u30665\u65B9\u5411\u3078\u6574\u7406\u3057\u305F\u30B3\u30D4\u30FC\u6848\u3067\u3059\u3002`);
    addPill(board, 28, 94, "30\u6848\u3092\u63A2\u7D22 -> 5\u65B9\u5411\u3092\u62BD\u51FA", COLORS.blue);
    let y = 134;
    directions.slice(0, 5).forEach((direction, index) => {
      const card = createCard(28, y, 784, 122);
      board.appendChild(card);
      addText(card, `${index + 1}. ${direction.title}`, 18, 16, { size: 16, bold: true, width: 740 });
      addText(card, direction.intent, 18, 42, { size: 11, color: COLORS.muted, width: 740, height: 28 });
      addText(card, `Main: ${direction.copy.main.replace(/\n/g, " / ")}`, 18, 72, { size: 12, width: 740 });
      addText(card, `Sub: ${direction.copy.sub}`, 18, 92, { size: 11, color: COLORS.muted, width: 520 });
      if (direction.copy.cta) addPill(card, 604, 88, direction.copy.cta, COLORS.green);
      y += 138;
    });
    return board;
  }
  function renderLayoutBoard(project) {
    const board = createBoard("Layout Strategy Board", "\u30B3\u30D4\u30FC\u65B9\u5411\u6027\u3054\u3068\u306E\u69CB\u56F3\u3001\u512A\u5148\u9806\u4F4D\u3001\u8272\u3001\u80CC\u666F\u65B9\u91DD\u3092\u4E26\u3079\u307E\u3059\u3002");
    let y = 112;
    project.layoutStrategies.slice(0, 5).forEach((strategy, index) => {
      const card = createCard(28, y, 784, 124);
      board.appendChild(card);
      addText(card, `${index + 1}. ${strategy.directionName}`, 18, 16, { size: 15, bold: true, width: 360 });
      addPill(card, 602, 14, strategy.layoutType, COLORS.blue);
      addText(card, `\u69CB\u56F3: ${strategy.composition}`, 18, 44, { size: 11, width: 740, height: 28 });
      addText(card, `\u512A\u5148\u9806\u4F4D: ${strategy.hierarchy.join(" > ")}`, 18, 76, { size: 11, width: 740 });
      addText(card, `\u8272: ${strategy.colorDirection}`, 18, 96, { size: 10, color: COLORS.muted, width: 740 });
      y += 140;
    });
    return board;
  }
  function renderCandidateBoard(candidates, directions) {
    const board = createBoard("Layout Candidates Board", "\u5B9F\u969B\u306ESVG\u5019\u88DC\u3092\u30AB\u30FC\u30C9\u5185\u306B\u6574\u5217\u3057\u3001\u65B9\u5411\u6027\u3068\u30BB\u30C3\u30C8\u3067\u78BA\u8A8D\u3057\u307E\u3059\u3002");
    const byDirection = new Map(directions.map((direction) => [direction.id, direction]));
    const positions = [
      [28, 112],
      [442, 112],
      [28, 392],
      [442, 392],
      [28, 672]
    ];
    candidates.slice(0, 5).forEach((candidate, index) => {
      var _a, _b;
      const [x, y] = positions[index];
      const card = createCard(x, y, 370, 246);
      board.appendChild(card);
      const svgNode = figma.createNodeFromSvg(candidate.svg);
      svgNode.name = candidate.name;
      svgNode.x = 14;
      svgNode.y = 42;
      svgNode.resize(320, 180);
      card.appendChild(svgNode);
      const direction = byDirection.get(candidate.directionId);
      addText(card, (_a = direction == null ? void 0 : direction.title) != null ? _a : candidate.name, 14, 14, { size: 13, bold: true, width: 260 });
      addPill(card, 262, 12, candidate.directionId, COLORS.blue, 84);
      addText(card, (_b = direction == null ? void 0 : direction.summary) != null ? _b : candidate.name, 14, 224, { size: 10, color: COLORS.muted, width: 330 });
    });
    return board;
  }
  function renderDiagnosisBoard(results) {
    const board = createBoard("Diagnosis Board", "\u9078\u629E\u6848\u306E\u4F1D\u308F\u308A\u65B9\u3068\u3001\u6700\u521D\u306B\u76F4\u3059\u306A\u3089\u3069\u3053\u304B\u3092\u6574\u7406\u3057\u307E\u3059\u3002");
    const result = results[results.length - 1];
    if (!result) {
      addEmpty(board, "\u307E\u3060\u8A3A\u65AD\u7D50\u679C\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u8A3A\u65AD\u3092\u5B9F\u884C\u3059\u308B\u3068\u3053\u3053\u306B\u30AB\u30FC\u30C9\u304C\u8FFD\u52A0\u3055\u308C\u307E\u3059\u3002");
      return board;
    }
    let y = 112;
    y = addKeyValueCard(board, 28, y, "\u5BFE\u8C61\u6848", result.frameName);
    y = addKeyValueCard(board, 28, y, "\u8A3A\u65AD\u6982\u8981", result.summary);
    y = addKeyValueCard(board, 28, y, "\u6700\u521D\u306B\u4F1D\u308F\u308B\u3053\u3068", result.firstImpression);
    y = addListCard(board, 28, y, "\u5F37\u3044\u70B9", result.strengths);
    y = addListCard(board, 28, y, "\u6C17\u306B\u306A\u308B\u70B9", result.concerns);
    y = addListCard(board, 28, y, "\u6700\u521D\u306B\u76F4\u3059\u306A\u3089", result.fixPriority.map((item) => `${item.target}: ${item.suggestion}`));
    addListCard(board, 28, y, "\u3053\u306E\u6307\u6458\u304B\u3089\u4F5C\u308C\u308B\u6D3E\u751F\u6848", result.rewriteInstructions.map((item) => `${item.label}: ${item.instruction}`));
    return board;
  }
  function renderCompareBoard(result) {
    const board = createBoard("Compare Board", "\u8907\u6570\u6848\u306E\u5F79\u5272\u3001\u5F37\u307F\u3001\u61F8\u5FF5\u3001\u80CC\u666F\u751F\u6210brief\u3092\u30EC\u30D3\u30E5\u30FC\u3057\u307E\u3059\u3002");
    if (!result) {
      addEmpty(board, "\u307E\u3060\u6BD4\u8F03\u7D50\u679C\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u6BD4\u8F03\u3092\u5B9F\u884C\u3059\u308B\u3068\u3053\u3053\u306B\u8868\u304C\u8FFD\u52A0\u3055\u308C\u307E\u3059\u3002");
      return board;
    }
    let y = 112;
    y = addKeyValueCard(board, 28, y, "\u6BD4\u8F03\u6982\u8981", result.comparisonSummary);
    const table = createCard(28, y, 784, 238);
    board.appendChild(table);
    addText(table, "\u6BD4\u8F03\u8868", 18, 16, { size: 15, bold: true });
    let rowY = 48;
    result.frameRoles.slice(0, 5).forEach((role) => {
      addText(table, role.frameName, 18, rowY, { size: 11, bold: true, width: 130 });
      addText(table, role.role, 156, rowY, { size: 10, width: 110 });
      addText(table, role.strength, 276, rowY, { size: 10, width: 190 });
      addText(table, role.risk, 474, rowY, { size: 10, color: COLORS.muted, width: 288, height: 34 });
      rowY += 36;
    });
    y += 254;
    y = addKeyValueCard(board, 28, y, "\u30D9\u30FC\u30B9\u5019\u88DC", findFrameName(result, result.recommendation.primaryFrameId));
    y = addKeyValueCard(board, 28, y, "\u6B21\u70B9\u5019\u88DC", result.recommendation.secondaryFrameId ? findFrameName(result, result.recommendation.secondaryFrameId) : "\u306A\u3057");
    y = addKeyValueCard(board, 28, y, "\u9078\u5B9A\u7406\u7531", result.recommendation.primaryReason);
    addListCard(board, 28, y, "background brief", [
      `\u80CC\u666F\u306E\u65B9\u5411\u6027: ${result.backgroundBrief.promptText}`,
      `\u907F\u3051\u308B\u3053\u3068: ${result.backgroundBrief.avoid.join(", ")}`,
      `\u6587\u5B57\u9818\u57DF\u3078\u306E\u914D\u616E: ${result.backgroundBrief.safeAreaHint}`,
      `keywords: ${result.backgroundBrief.suggestedStyleKeywords.join(", ")}`
    ]);
    return board;
  }
  function renderFinishBoard(result, comparison) {
    var _a, _b;
    const board = createBoard("Finish Board", "\u9078\u3070\u308C\u305F\u6848\u3060\u3051\u3092\u80CC\u666F\u3067\u4ED5\u4E0A\u3052\u3001\u6700\u7D42\u6848\u3068\u3057\u3066\u78BA\u8A8D\u3057\u307E\u3059\u3002");
    const brief = (_a = result == null ? void 0 : result.brief) != null ? _a : comparison == null ? void 0 : comparison.backgroundBrief;
    if (!brief) {
      addEmpty(board, "\u307E\u3060\u4ED5\u4E0A\u3052\u7D50\u679C\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u6BD4\u8F03\u304B\u3089\u80CC\u666F\u751F\u6210brief\u3092\u9001\u308B\u3068\u3053\u3053\u306B\u8868\u793A\u3055\u308C\u307E\u3059\u3002");
      return board;
    }
    let y = 112;
    y = addKeyValueCard(board, 28, y, "\u5BFE\u8C61\u6848", brief.targetFrameName);
    y = addKeyValueCard(board, 28, y, "background brief", brief.promptText);
    y = addKeyValueCard(board, 28, y, "\u80CC\u666F\u30B9\u30BF\u30A4\u30EB", `${brief.mood} / ${brief.style}`);
    y = addListCard(board, 28, y, "\u907F\u3051\u308B\u3053\u3068", brief.avoid);
    const beforeAfter = createCard(28, y, 784, 190);
    board.appendChild(beforeAfter);
    addText(beforeAfter, "\u9069\u7528\u524D", 28, 20, { size: 13, bold: true });
    addText(beforeAfter, "\u9069\u7528\u5F8C", 426, 20, { size: 13, bold: true });
    addPreviewBox(beforeAfter, 28, 52, "\u80CC\u666F\u9069\u7528\u524D");
    addPreviewBox(beforeAfter, 426, 52, result ? `\u6700\u7D42\u6848 / ${result.styleName}` : "\u80CC\u666F\u751F\u6210\u5F85\u3061");
    y += 206;
    if (result) addKeyValueCard(board, 28, y, "\u6210\u529F\u30E1\u30C3\u30BB\u30FC\u30B8", (_b = result.message) != null ? _b : "\u80CC\u666F\u30EC\u30A4\u30E4\u30FC\u3092\u9069\u7528\u3067\u304D\u307E\u3059\u3002");
    return board;
  }
  function createBoard(title, description) {
    const frame = createFrame(title, 0, 0, 860, 880, COLORS.board);
    frame.cornerRadius = 18;
    frame.strokes = [{ type: "SOLID", color: COLORS.border }];
    frame.strokeWeight = 1;
    addText(frame, title, 28, 28, { size: 24, bold: true, width: 760 });
    addText(frame, description, 28, 64, { size: 12, color: COLORS.muted, width: 760 });
    const line = figma.createRectangle();
    line.resize(804, 1);
    line.x = 28;
    line.y = 96;
    line.fills = [{ type: "SOLID", color: COLORS.border }];
    frame.appendChild(line);
    return frame;
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
  function addKeyValueCard(parent2, x, y, label, value) {
    const height = Math.max(74, Math.ceil(value.length / 60) * 20 + 48);
    const card = createCard(x, y, 784, height);
    parent2.appendChild(card);
    addText(card, label, 18, 14, { size: 11, color: COLORS.blue, bold: true, width: 720 });
    addText(card, value || "\u672A\u6307\u5B9A", 18, 34, { size: 13, width: 740, height: height - 44 });
    return y + height + 12;
  }
  function addListCard(parent2, x, y, label, items) {
    const visibleItems = items.length > 0 ? items.slice(0, 5) : ["\u9805\u76EE\u306F\u3042\u308A\u307E\u305B\u3093\u3002"];
    const height = Math.max(88, visibleItems.length * 34 + 48);
    const card = createCard(x, y, 784, height);
    parent2.appendChild(card);
    addText(card, label, 18, 14, { size: 13, bold: true, width: 720 });
    visibleItems.forEach((item, index) => addText(card, `- ${item}`, 18, 42 + index * 34, { size: 11, color: COLORS.muted, width: 740, height: 30 }));
    return y + height + 12;
  }
  function addEmpty(parent2, message) {
    const card = createCard(28, 132, 784, 180);
    parent2.appendChild(card);
    addText(card, "\u307E\u3060\u51FA\u529B\u306F\u3042\u308A\u307E\u305B\u3093", 28, 40, { size: 18, bold: true, width: 720 });
    addText(card, message, 28, 76, { size: 13, color: COLORS.muted, width: 700 });
  }
  function addPreviewBox(parent2, x, y, label) {
    const box = createFrame(label, x, y, 330, 110, COLORS.paleBlue);
    box.cornerRadius = 10;
    box.strokes = [{ type: "SOLID", color: COLORS.border }];
    box.strokeWeight = 1;
    parent2.appendChild(box);
    addText(box, label, 20, 42, { size: 14, bold: true, color: COLORS.blue, width: 280 });
  }
  function addPill(parent2, x, y, text, fill, width = 240) {
    const pill = figma.createFrame();
    pill.name = `Pill / ${text}`;
    pill.x = x;
    pill.y = y;
    pill.resize(width, 28);
    pill.cornerRadius = 14;
    pill.fills = [{ type: "SOLID", color: fill }];
    parent2.appendChild(pill);
    addText(pill, text, 12, 7, { size: 10, color: { r: 1, g: 1, b: 1 }, bold: true, width: width - 24, height: 14 });
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
        const startX = figma.viewport.center.x - 400;
        const startY = figma.viewport.center.y - 225;
        const nodes = message.payload.items.map(
          (item, index) => createSvgNode(item.svg, item.name, {
            x: startX + index * 900,
            y: startY,
            select: false,
            zoom: false
          })
        );
        figma.currentPage.selection = nodes;
        figma.viewport.scrollAndZoomIntoView(nodes);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: `${message.payload.items.length}\u6848\u3092\u6A2A\u4E26\u3073\u3067Figma\u306B\u914D\u7F6E\u3057\u307E\u3057\u305F\u3002` } });
        return;
      }
      if (message.type === "RENDER_PROCESS_BOARD") {
        await renderProcessBoard(message.payload);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u30D7\u30ED\u30BB\u30B9\u30DC\u30FC\u30C9\u3092Figma\u306B\u4F5C\u6210\u3057\u307E\u3057\u305F\u3002" } });
        return;
      }
      if (message.type === "RENDER_DIAGNOSIS_BOARD") {
        await renderStandaloneDiagnosisBoard(message.payload);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u8A3A\u65AD\u30DC\u30FC\u30C9\u3092Figma\u306B\u8FFD\u52A0\u3057\u307E\u3057\u305F\u3002" } });
        return;
      }
      if (message.type === "RENDER_COMPARE_BOARD") {
        await renderStandaloneCompareBoard(message.payload);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u6BD4\u8F03\u30DC\u30FC\u30C9\u3092Figma\u306B\u8FFD\u52A0\u3057\u307E\u3057\u305F\u3002" } });
        return;
      }
      if (message.type === "RENDER_FINISH_BOARD") {
        await renderStandaloneFinishBoard(message.payload.backgroundResult, message.payload.comparisonResult);
        postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "\u4ED5\u4E0A\u3052\u30DC\u30FC\u30C9\u3092Figma\u306B\u8FFD\u52A0\u3057\u307E\u3057\u305F\u3002" } });
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
})();
