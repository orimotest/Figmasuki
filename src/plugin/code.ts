import { appConfig } from "../config/app";
import type { ProjectData } from "../schemas/project";
import { createSvgNode } from "./figma/createSvgNode";
import { extractFrameData } from "./figma/extractFrameData";
import { extractMultiFrameData } from "./figma/extractMultiFrameData";
import { insertBackgroundImage } from "./figma/insertBackgroundImage";
import { getErrorMessage, parsePluginRequestMessage, postToUi } from "./figma/messageBridge";
import {
  renderProcessBoard,
  renderProcessStageBoard,
  renderStandaloneCompareBoard,
  renderStandaloneDiagnosisBoard,
  renderStandaloneFinishBoard,
} from "./figma/renderProcessBoard";

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
    if (message.type === "INSERT_SVG") {
      createSvgNode(message.payload.svg, message.payload.name);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "SVGをFigmaに配置しました。" } });
      return;
    }

    if (message.type === "INSERT_SVG_BATCH") {
      const nodes = placeSvgCandidates(message.payload.items, message.payload.x !== undefined && message.payload.y !== undefined ? { x: message.payload.x, y: message.payload.y } : undefined);
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: `${message.payload.items.length}案を横並びでFigmaに配置しました。` } });
      return;
    }

    if (message.type === "PLACE_EXPLORE_PACKAGE") {
      const startX = figma.viewport.center.x - 4250;
      const startY = figma.viewport.center.y + 360;
      const boards = [];
      boards.push(await renderProcessStageBoard(message.payload, "project_header", { x: startX, y: startY, zoom: false }));
      await sleep(350);
      boards.push(await renderProcessStageBoard(message.payload, "ideas", { x: startX + 660, y: startY, zoom: false }));
      await sleep(500);
      boards.push(await renderProcessStageBoard(message.payload, "typography_drafts", { x: startX + 1920, y: startY, zoom: false }));
      await sleep(500);
      boards.push(await renderProcessStageBoard(message.payload, "refined_svgs", { x: startX + 3380, y: startY, zoom: false }));
      await sleep(350);
      const nodes = placeProjectCandidates(message.payload, { x: startX + 3380, y: startY - 620 });
      figma.currentPage.selection = [...nodes, ...boards];
      figma.viewport.scrollAndZoomIntoView([...nodes, ...boards]);
      postToUi({
        type: "PLUGIN_SUCCESS",
        payload: { message: `${nodes.length}案と各フェーズの記録ボードをFigmaに配置しました。` },
      });
      return;
    }

    if (message.type === "RENDER_PROCESS_BOARD") {
      await renderProcessBoard(message.payload);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "各フェーズの記録ボードをFigmaに作成しました。" } });
      return;
    }

    if (message.type === "RENDER_PROCESS_STAGE_BOARD") {
      await renderProcessStageBoard(message.payload.project, message.payload.stage, {
        x: message.payload.x,
        y: message.payload.y,
        zoom: message.payload.zoom,
      });
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
  const startX = position?.x ?? figma.viewport.center.x - 400;
  const startY = position?.y ?? figma.viewport.center.y - 225;
  return items.map((item, index) =>
    createSvgNode(item.svg, item.name, {
      x: startX + index * 900,
      y: startY,
      select: false,
      zoom: false,
    }),
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
