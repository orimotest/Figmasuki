import { appConfig } from "../config/app";
import { createSvgNode } from "./figma/createSvgNode";
import { extractFrameData } from "./figma/extractFrameData";
import { extractMultiFrameData } from "./figma/extractMultiFrameData";
import { insertBackgroundImage } from "./figma/insertBackgroundImage";
import { getErrorMessage, parsePluginRequestMessage, postToUi } from "./figma/messageBridge";
import {
  renderProcessBoard,
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
      const startX = figma.viewport.center.x - 400;
      const startY = figma.viewport.center.y - 225;
      const nodes = message.payload.items.map((item, index) =>
        createSvgNode(item.svg, item.name, {
          x: startX + index * 900,
          y: startY,
          select: false,
          zoom: false,
        }),
      );
      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: `${message.payload.items.length}案を横並びでFigmaに配置しました。` } });
      return;
    }

    if (message.type === "RENDER_PROCESS_BOARD") {
      await renderProcessBoard(message.payload);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "プロセスボードをFigmaに作成しました。" } });
      return;
    }

    if (message.type === "RENDER_DIAGNOSIS_BOARD") {
      await renderStandaloneDiagnosisBoard(message.payload);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "診断ボードをFigmaに追加しました。" } });
      return;
    }

    if (message.type === "RENDER_COMPARE_BOARD") {
      await renderStandaloneCompareBoard(message.payload);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "比較ボードをFigmaに追加しました。" } });
      return;
    }

    if (message.type === "RENDER_FINISH_BOARD") {
      await renderStandaloneFinishBoard(message.payload.backgroundResult, message.payload.comparisonResult);
      postToUi({ type: "PLUGIN_SUCCESS", payload: { message: "仕上げボードをFigmaに追加しました。" } });
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
