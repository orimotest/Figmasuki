import type { BackgroundResult } from "../../schemas/background";
import type { ComparisonResult } from "../../schemas/comparison";
import type { DiagnosisResult } from "../../schemas/diagnosis";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import type { ProjectData } from "../../schemas/project";
import { hasString, isRecord } from "../../utils/guards";

export type PluginRequestMessage =
  | { type: "INSERT_SVG"; payload: { svg: string; name?: string } }
  | { type: "INSERT_SVG_BATCH"; payload: { items: Array<{ svg: string; name?: string }> } }
  | { type: "PLACE_EXPLORE_PACKAGE"; payload: ProjectData }
  | { type: "RENDER_PROCESS_BOARD"; payload: ProjectData }
  | { type: "RENDER_DIAGNOSIS_BOARD"; payload: DiagnosisResult }
  | { type: "RENDER_COMPARE_BOARD"; payload: ComparisonResult }
  | { type: "RENDER_FINISH_BOARD"; payload: { backgroundResult: BackgroundResult; comparisonResult?: ComparisonResult } }
  | { type: "REQUEST_SELECTED_FRAME" }
  | { type: "REQUEST_SELECTED_FRAMES" }
  | { type: "APPLY_BACKGROUND"; payload: { targetFrameId: string; backgroundResult: BackgroundResult } };

export type PluginResponseMessage =
  | { type: "SELECTION_FRAME_RESULT"; payload: FigmaFrameData }
  | { type: "SELECTION_FRAMES_RESULT"; payload: FigmaFrameData[] }
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

  if (value.type === "REQUEST_SELECTED_FRAME" || value.type === "REQUEST_SELECTED_FRAMES") {
    return { type: value.type };
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
      },
    };
  }

  if (value.type === "PLACE_EXPLORE_PACKAGE" && isRecord(value.payload)) {
    return { type: "PLACE_EXPLORE_PACKAGE", payload: value.payload as ProjectData };
  }

  if (value.type === "RENDER_PROCESS_BOARD" && isRecord(value.payload)) {
    return { type: "RENDER_PROCESS_BOARD", payload: value.payload as ProjectData };
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

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected plugin error.";
}
