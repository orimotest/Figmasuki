import { providerConfig } from "../config/providers";
import { CANVAS_SIZE } from "../config/canvas";
import type { BackgroundBrief, BackgroundResult } from "../schemas/background";
import type { ContentType } from "../schemas/content";
import type { ComparisonResult, FrameCompareSummary } from "../schemas/comparison";
import type { DiagnosisResult, RuleCheckReport } from "../schemas/diagnosis";
import type { Direction } from "../schemas/direction";
import type { FigmaFrameData } from "../schemas/figmaFrame";
import type { ExploreInput } from "../schemas/input";
import type { ProviderConfig } from "../schemas/provider";
import type { ExploreResult, SvgCandidate } from "../schemas/svg";
import { demoGenerateBackground } from "./demo/demoBackground";
import { demoCompare } from "./demo/demoCompare";
import { demoDiagnose } from "./demo/demoDiagnosis";
import { demoExplore } from "./demo/demoExplore";
import { demoGenerateSvg } from "./demo/demoSvg";
import { compareWithDify } from "./dify/compareClient";
import { exploreCopyWithDify } from "./dify/copyExplorer";
import { diagnoseWithDify } from "./dify/diagnosisClient";
import { exploreLayoutWithDify } from "./dify/layoutExplorer";
import { generateBackgroundWithGemini } from "./gemini/backgroundGenerator";
import { generateSvgWithGemini } from "./gemini/svgGenerator";

const activeProviderConfig: ProviderConfig = providerConfig;

export async function explore(input?: ExploreInput): Promise<ExploreResult> {
  if (activeProviderConfig.layout === "dify") {
    if (!input) {
      throw new Error("Explore input is required for live providers.");
    }
    return withDemoFallback("dify", () => exploreLayoutWithDify(input), () => demoExplore(input));
  }
  if (activeProviderConfig.copy === "dify") {
    if (!input) {
      throw new Error("Explore input is required for live providers.");
    }
    return withDemoFallback<ExploreResult>(
      "dify",
      async (): Promise<ExploreResult> => {
        const output = await exploreCopyWithDify(input);
        return {
          contentType: input.contentType,
          inputMode: input.inputMode,
          canvasSize: CANVAS_SIZE,
          exploredCount: 30,
          selectedCount: 5,
          input,
          directions: output.directions,
          providerMeta: { provider: "dify", fallbackUsed: false },
        };
      },
      () => demoExplore(input),
    );
  }
  return demoExplore(input);
}

export async function generateSvg(direction: Direction): Promise<SvgCandidate> {
  if (activeProviderConfig.svg === "gemini") {
    return withDemoFallback("gemini", () => generateSvgWithGemini(direction), () => demoGenerateSvg(direction));
  }
  return demoGenerateSvg(direction);
}

export async function diagnose(frame: FigmaFrameData, contentType: ContentType, ruleCheck?: RuleCheckReport): Promise<DiagnosisResult> {
  if (activeProviderConfig.diagnosis === "dify") {
    return withDemoFallback("dify", () => diagnoseWithDify(frame, contentType, ruleCheck), () => demoDiagnose(frame, contentType, ruleCheck));
  }
  return demoDiagnose(frame, contentType, ruleCheck);
}

export async function compare(
  frames: FigmaFrameData[],
  contentType: ContentType,
  frameSummaries?: FrameCompareSummary[],
): Promise<ComparisonResult> {
  if (activeProviderConfig.compare === "dify") {
    return withDemoFallback("dify", () => compareWithDify(frames, contentType, frameSummaries), () => demoCompare(frames, contentType, frameSummaries));
  }
  return demoCompare(frames, contentType, frameSummaries);
}

export async function generateBackground(brief: BackgroundBrief): Promise<BackgroundResult> {
  if (activeProviderConfig.background === "gemini") {
    return withDemoFallback("gemini", () => generateBackgroundWithGemini(brief), () => demoGenerateBackground(brief));
  }
  return demoGenerateBackground(brief);
}

export { providerConfig };

async function withDemoFallback<T extends object>(
  provider: "dify" | "gemini",
  liveCall: () => Promise<T>,
  demoCall: () => Promise<T>,
): Promise<T> {
  try {
    return await liveCall();
  } catch (error) {
    if (!activeProviderConfig.fallbackToDemo) {
      throw error;
    }
    const fallback = await demoCall();
    const reason = error instanceof Error ? error.message : "Live provider failed.";
    return attachProviderMeta(fallback, provider, reason);
  }
}

function attachProviderMeta<T extends object>(value: T, provider: "dify" | "gemini", reason: string): T {
  if ("meta" in value && typeof value.meta === "object" && value.meta !== null) {
    return {
      ...value,
      meta: {
        ...value.meta,
        provider,
        fallbackUsed: true,
        fallbackReason: reason,
      },
    };
  }
  return {
    ...value,
    providerMeta: {
      provider,
      fallbackUsed: true,
      fallbackReason: reason,
    },
  };
}
