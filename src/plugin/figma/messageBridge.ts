import type { BackgroundResult } from "../../schemas/background";
import type { ComparisonResult } from "../../schemas/comparison";
import type { DiagnosisResult } from "../../schemas/diagnosis";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import type { RuntimeApiSettings } from "../../schemas/apiSettings";
import type { ProjectData } from "../../schemas/project";
import type { ProcessBoardStage } from "../../schemas/production";
import { hasString, isRecord } from "../../utils/guards";

export type PluginRequestMessage =
  | { type: "INSERT_SVG"; payload: { svg: string; name?: string } }
  | { type: "INSERT_SVG_BATCH"; payload: { items: Array<{ svg: string; name?: string }>; x?: number; y?: number } }
  | { type: "PLACE_EXPLORE_PACKAGE"; payload: ProjectData }
  | { type: "RENDER_PROCESS_BOARD"; payload: ProjectData }
  | { type: "RENDER_PROCESS_STAGE_BOARD"; payload: { project: ProjectData; stage: ProcessBoardStage; x?: number; y?: number; zoom?: boolean } }
  | { type: "RENDER_DIAGNOSIS_BOARD"; payload: DiagnosisResult }
  | { type: "RENDER_COMPARE_BOARD"; payload: ComparisonResult }
  | { type: "RENDER_FINISH_BOARD"; payload: { backgroundResult: BackgroundResult; comparisonResult?: ComparisonResult } }
  | { type: "REQUEST_SELECTED_FRAME" }
  | { type: "REQUEST_SELECTED_FRAMES" }
  | { type: "RESIZE_UI"; payload: { width: number; height: number } }
  | { type: "LOAD_API_SETTINGS" }
  | { type: "SAVE_API_SETTINGS"; payload: RuntimeApiSettings }
  | { type: "TEST_API_SETTINGS"; payload: RuntimeApiSettings }
  | { type: "APPLY_BACKGROUND"; payload: { targetFrameId: string; backgroundResult: BackgroundResult } };

export type PluginResponseMessage =
  | { type: "SELECTION_FRAME_RESULT"; payload: FigmaFrameData }
  | { type: "SELECTION_FRAMES_RESULT"; payload: FigmaFrameData[] }
  | { type: "API_SETTINGS_LOADED"; payload: { settings?: RuntimeApiSettings } }
  | { type: "API_SETTINGS_SAVED"; payload: { saved: true } }
  | { type: "API_SETTINGS_TEST_RESULT"; payload: { ok: boolean; message: string } }
  | { type: "PLUGIN_ERROR"; payload: { message: string } }
  | { type: "PLUGIN_SUCCESS"; payload: { message: string } };

export type PluginMessage = PluginRequestMessage | PluginResponseMessage;

export function postToPlugin(message: PluginRequestMessage): void {
  parent.postMessage({ pluginMessage: message }, "*");
}

export function postToUi(message: PluginResponseMessage): void {
  figma.ui.postMessage(message);
}

export function parsePluginRequestMessage(value: unknown): PluginRequestMessage | null {
  if (!isRecord(value) || !hasString(value, "type")) {
    return null;
  }

  if (value.type === "REQUEST_SELECTED_FRAME" || value.type === "REQUEST_SELECTED_FRAMES" || value.type === "LOAD_API_SETTINGS") {
    return { type: value.type };
  }

  if ((value.type === "SAVE_API_SETTINGS" || value.type === "TEST_API_SETTINGS") && isRecord(value.payload)) {
    return { type: value.type, payload: value.payload as RuntimeApiSettings };
  }

  if (value.type === "RESIZE_UI" && isRecord(value.payload)) {
    const width = typeof value.payload.width === "number" ? value.payload.width : 960;
    const height = typeof value.payload.height === "number" ? value.payload.height : 720;
    return {
      type: "RESIZE_UI",
      payload: {
        width: Math.max(640, Math.min(1280, Math.round(width))),
        height: Math.max(420, Math.min(920, Math.round(height))),
      },
    };
  }

  if (value.type === "INSERT_SVG" && isRecord(value.payload) && hasString(value.payload, "svg")) {
    return {
      type: "INSERT_SVG",
      payload: {
        svg: value.payload.svg,
        name: typeof value.payload.name === "string" ? value.payload.name : undefined,
      },
    };
  }

  if (value.type === "INSERT_SVG_BATCH" && isRecord(value.payload) && Array.isArray(value.payload.items)) {
    return {
      type: "INSERT_SVG_BATCH",
      payload: {
        items: value.payload.items
          .filter((item): item is { svg: string; name?: string } => isRecord(item) && hasString(item, "svg"))
          .map((item) => ({ svg: item.svg, name: typeof item.name === "string" ? item.name : undefined })),
        x: typeof value.payload.x === "number" ? value.payload.x : undefined,
        y: typeof value.payload.y === "number" ? value.payload.y : undefined,
      },
    };
  }

  if (value.type === "PLACE_EXPLORE_PACKAGE" && isRecord(value.payload)) {
    return { type: "PLACE_EXPLORE_PACKAGE", payload: value.payload as ProjectData };
  }

  if (value.type === "RENDER_PROCESS_BOARD" && isRecord(value.payload)) {
    return { type: "RENDER_PROCESS_BOARD", payload: value.payload as ProjectData };
  }

  if (
    value.type === "RENDER_PROCESS_STAGE_BOARD" &&
    isRecord(value.payload) &&
    isRecord(value.payload.project) &&
    hasString(value.payload, "stage") &&
    isProcessBoardStage(value.payload.stage)
  ) {
    return {
      type: "RENDER_PROCESS_STAGE_BOARD",
      payload: {
        project: value.payload.project as ProjectData,
        stage: value.payload.stage,
        x: typeof value.payload.x === "number" ? value.payload.x : undefined,
        y: typeof value.payload.y === "number" ? value.payload.y : undefined,
        zoom: typeof value.payload.zoom === "boolean" ? value.payload.zoom : undefined,
      },
    };
  }

  if (value.type === "RENDER_DIAGNOSIS_BOARD" && isRecord(value.payload)) {
    return { type: "RENDER_DIAGNOSIS_BOARD", payload: value.payload as DiagnosisResult };
  }

  if (value.type === "RENDER_COMPARE_BOARD" && isRecord(value.payload)) {
    return { type: "RENDER_COMPARE_BOARD", payload: value.payload as ComparisonResult };
  }

  if (value.type === "RENDER_FINISH_BOARD" && isRecord(value.payload) && isRecord(value.payload.backgroundResult)) {
    return {
      type: "RENDER_FINISH_BOARD",
      payload: {
        backgroundResult: value.payload.backgroundResult as BackgroundResult,
        comparisonResult: isRecord(value.payload.comparisonResult) ? (value.payload.comparisonResult as ComparisonResult) : undefined,
      },
    };
  }

  if (
    value.type === "APPLY_BACKGROUND" &&
    isRecord(value.payload) &&
    hasString(value.payload, "targetFrameId") &&
    isRecord(value.payload.backgroundResult)
  ) {
    return {
      type: "APPLY_BACKGROUND",
      payload: {
        targetFrameId: value.payload.targetFrameId,
        backgroundResult: value.payload.backgroundResult as BackgroundResult,
      },
    };
  }

  return null;
}

function isProcessBoardStage(value: string): value is ProcessBoardStage {
  return [
    "project_header",
    "ideas",
    "typography_drafts",
    "refined_svgs",
    "diagnosis",
    "compare",
    "background_variations",
    "final_candidate",
  ].includes(value);
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected plugin error.";
}
