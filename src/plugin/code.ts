import { appConfig } from "../config/app";
import { RUNTIME_API_SETTINGS_STORAGE_KEY } from "../config/runtimeApiSettings";
import type { RuntimeApiSettings } from "../schemas/apiSettings";
import type { ProjectData } from "../schemas/project";
import { createSvgNode } from "./figma/createSvgNode";
import { extractFrameData } from "./figma/extractFrameData";
import { extractMultiFrameData } from "./figma/extractMultiFrameData";
import { insertBackgroundImage } from "./figma/insertBackgroundImage";
import { getErrorMessage, parsePluginRequestMessage, postToUi } from "./figma/messageBridge";
import {
  PROCESS_STAGE_POSITIONS,
  renderProcessBoard,
  renderProcessStageBoard,
  renderStandaloneCompareBoard,
  renderStandaloneDiagnosisBoard,
  renderStandaloneFinishBoard,
} from "./figma/renderProcessBoard";

const PROCESS_LAYOUT = {
  baseXOffset: -3800,
  baseYOffset: -760,
  bannersY: 1140,
  candidateGap: 80,
};

let activeProcessBase: { startX: number; startY: number } | null = null;

figma.showUI(__html__, {
  width: appConfig.uiWidth,
  height: appConfig.uiHeight,
});

figma.ui.onmessage = async (rawMessage: unknown) => {
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
      const settings = (await figma.clientStorage.getAsync(RUNTIME_API_SETTINGS_STORAGE_KEY)) as RuntimeApiSettings | undefined;
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
          message: hasDify || hasGemini ? "保存済み設定を確認しました。Live Modeへ切り替える準備があります。" : "API設定が未完了です。DifyまたはGeminiのURL / Keyを入力してください。",
        },
      });
      return;
    }

    if (message.type === "INSERT_SVG") {
      createSvgNode(message.payload.svg, message.payload.name);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "SVGをFigmaに配置しました。" } });
      return;
    }

    if (message.type === "INSERT_SVG_BATCH") {
      const nodes = placeSvgCandidates(message.payload.items, message.payload.x !== undefined && message.payload.y !== undefined ? { x: message.payload.x, y: message.payload.y } : undefined);
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: `${message.payload.items.length}案をFigmaに配置しました。` } });
      return;
    }

    if (message.type === "PLACE_EXPLORE_PACKAGE") {
      const { startX, startY } = resetProcessBase();
      const boards = [];
      boards.push(await renderProcessStageBoard(message.payload, "project_header", { x: startX, y: startY, zoom: false }));
      await sleep(350);
      boards.push(await renderProcessStageBoard(message.payload, "ideas", { ...getStagePosition("ideas", startX, startY), zoom: false }));
      await sleep(500);
      boards.push(await renderProcessStageBoard(message.payload, "typography_drafts", { ...getStagePosition("typography_drafts", startX, startY), zoom: false }));
      await sleep(500);
      boards.push(await renderProcessStageBoard(message.payload, "refined_svgs", { ...getStagePosition("refined_svgs", startX, startY), zoom: false }));
      await sleep(350);
      boards.push(await renderProcessStageBoard(message.payload, "compare", { ...getStagePosition("compare", startX, startY), zoom: false }));
      boards.push(await renderProcessStageBoard(message.payload, "background_variations", { ...getStagePosition("background_variations", startX, startY), zoom: false }));
      boards.push(await renderProcessStageBoard(message.payload, "final_candidate", { ...getStagePosition("final_candidate", startX, startY), zoom: false }));
      const nodes = placeProjectCandidates(message.payload, getArtifactPosition(startX, startY));
      const finalNodes = placeFinalCandidate(message.payload, getFinalArtifactPosition(startX, startY));
      figma.currentPage.selection = [...boards, ...nodes, ...finalNodes];
      figma.viewport.scrollAndZoomIntoView([...boards, ...nodes, ...finalNodes]);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: `${nodes.length}案と工程別ボードをFigmaに配置しました。` } });
      return;
    }

    if (message.type === "RENDER_PROCESS_BOARD") {
      const { startX, startY } = resetProcessBase();
      const boards = await renderProcessBoard(message.payload, { x: startX, y: startY, zoom: false });
      const nodes = placeProjectCandidates(message.payload, getArtifactPosition(startX, startY));
      const finalNodes = placeFinalCandidate(message.payload, getFinalArtifactPosition(startX, startY));
      figma.currentPage.selection = [...boards, ...nodes, ...finalNodes];
      figma.viewport.scrollAndZoomIntoView([...boards, ...nodes, ...finalNodes]);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "工程別ボードをFigmaに作成しました。" } });
      return;
    }

    if (message.type === "RENDER_PROCESS_STAGE_BOARD") {
      const processBase = message.payload.stage === "project_header" ? resetProcessBase() : getActiveProcessBase();
      const stagePosition =
        typeof message.payload.x === "number" && typeof message.payload.y === "number"
          ? { x: message.payload.x, y: message.payload.y }
          : getStagePosition(message.payload.stage, processBase.startX, processBase.startY);
      const board = await renderProcessStageBoard(message.payload.project, message.payload.stage, {
        x: stagePosition.x,
        y: stagePosition.y,
        zoom: message.payload.zoom,
      });
      const { startX, startY } = processBase;
      const artifactNodes =
        message.payload.stage === "refined_svgs"
          ? placeProjectCandidates(message.payload.project, getArtifactPosition(startX, startY))
          : message.payload.stage === "final_candidate"
            ? placeFinalCandidate(message.payload.project, getFinalArtifactPosition(startX, startY))
            : [];
      if (artifactNodes.length > 0) {
        figma.currentPage.selection = [board, ...artifactNodes];
        figma.viewport.scrollAndZoomIntoView([board, ...artifactNodes]);
      }
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "工程ボードをFigmaに作成しました。" } });
      return;
    }

    if (message.type === "RENDER_DIAGNOSIS_BOARD") {
      await renderStandaloneDiagnosisBoard(message.payload);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "診断結果をFigmaに記録しました。" } });
      return;
    }

    if (message.type === "RENDER_COMPARE_BOARD") {
      await renderStandaloneCompareBoard(message.payload);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "比較結果をFigmaに記録しました。" } });
      return;
    }

    if (message.type === "RENDER_FINISH_BOARD") {
      await renderStandaloneFinishBoard(message.payload.backgroundResult, message.payload.comparisonResult);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "仕上げ結果をFigmaに記録しました。" } });
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
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "背景レイヤーを適用しました。" } });
    }
  } catch (error) {
    postToUi({ type: "PLUGIN_ERROR", payload: { message: getErrorMessage(error) } });
  }
};

function placeProjectCandidates(project: ProjectData, position?: { x: number; y: number }) {
  return placeSvgCandidates(
    project.svgCandidates.map((candidate) => ({ svg: candidate.svg, name: candidate.name })),
    position,
  );
}

function placeSvgCandidates(items: Array<{ svg: string; name?: string }>, position?: { x: number; y: number }) {
  const startX = position?.x ?? figma.viewport.center.x + PROCESS_LAYOUT.baseXOffset;
  const startY = position?.y ?? figma.viewport.center.y + PROCESS_LAYOUT.baseYOffset + PROCESS_LAYOUT.bannersY;
  return items.map((item, index) =>
    createSvgNode(item.svg, item.name, {
      x: startX + index * (800 + PROCESS_LAYOUT.candidateGap),
      y: startY,
      select: false,
      zoom: false,
    }),
  );
}

function placeFinalCandidate(project: ProjectData, position: { x: number; y: number }) {
  const finalCandidateId = project.stageWorkflow?.finalCandidate?.refinedCandidateId;
  const candidate = project.svgCandidates.find((item) => item.id === finalCandidateId) ?? project.svgCandidates[0];
  const selectedBackground = project.stageWorkflow?.backgroundVariations.find((item) => item.id === project.stageWorkflow?.finalCandidate?.selectedBackgroundId || item.selected);
  if (!candidate) return [];
  if (selectedBackground?.imageDataUrl) {
    return [createFinalCandidateFrame(candidate.svg, selectedBackground.imageDataUrl, `FINAL_${candidate.name}`, position)];
  }
  return [
    createSvgNode(candidate.svg, `FINAL_${candidate.name}`, {
      x: position.x,
      y: position.y,
      select: false,
      zoom: false,
    }),
  ];
}

function createFinalCandidateFrame(svg: string, backgroundDataUrl: string, name: string, position: { x: number; y: number }): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.x = position.x;
  frame.y = position.y;
  frame.resize(800, 450);
  frame.cornerRadius = 0;
  frame.clipsContent = true;
  frame.fills = [{ type: "IMAGE", scaleMode: "FILL", imageHash: figma.createImage(dataUrlToBytes(backgroundDataUrl)).hash }];
  figma.currentPage.appendChild(frame);

  const overlay = figma.createNodeFromSvg(stripSvgBackground(svg));
  overlay.name = `${name}_editable_foreground`;
  const scale = Math.min(800 / Math.max(overlay.width, 1), 450 / Math.max(overlay.height, 1));
  const scalableOverlay = overlay as SceneNode & { rescale?: (scale: number) => void };
  if (typeof scalableOverlay.rescale === "function") {
    scalableOverlay.rescale(scale);
  } else {
    overlay.resize(overlay.width * scale, overlay.height * scale);
  }
  overlay.x = (800 - overlay.width) / 2;
  overlay.y = (450 - overlay.height) / 2;
  frame.appendChild(overlay);
  return frame;
}

function stripSvgBackground(svg: string): string {
  const foregroundOnly = svg
    .replace(/<g\s+id=["']background["'][\s\S]*?<\/g>/i, "")
    .replace(/<rect\s+width=["']800["']\s+height=["']450["'][^>]*\/>/i, "");

  return foregroundOnly.replace(/<svg([^>]*)>/i, '<svg$1><rect width="800" height="450" fill="#FFFFFF" opacity="0"/>');
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function getProcessBase() {
  return {
    startX: figma.viewport.center.x + PROCESS_LAYOUT.baseXOffset,
    startY: figma.viewport.center.y + PROCESS_LAYOUT.baseYOffset,
  };
}

function resetProcessBase() {
  activeProcessBase = getProcessBase();
  return activeProcessBase;
}

function getActiveProcessBase() {
  if (!activeProcessBase) {
    activeProcessBase = getProcessBase();
  }
  return activeProcessBase;
}

function getStagePosition(stage: keyof typeof PROCESS_STAGE_POSITIONS, startX: number, startY: number) {
  const position = PROCESS_STAGE_POSITIONS[stage];
  return { x: startX + position.x, y: startY + position.y };
}

function getArtifactPosition(startX: number, startY: number) {
  return { x: startX, y: startY + PROCESS_LAYOUT.bannersY };
}

function getFinalArtifactPosition(startX: number, startY: number) {
  return {
    x: startX + PROCESS_STAGE_POSITIONS.final_candidate.x,
    y: startY + PROCESS_LAYOUT.bannersY,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
