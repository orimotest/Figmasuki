import { providerConfig } from "../config/providers";
import { CANVAS_SIZE } from "../config/canvas";
import { env } from "../config/env";
import { hasDifyWorkflowSettings, hasGeminiSettings, isRuntimeApiMode } from "../config/runtimeApiSettings";
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
import { compareWithGemini } from "./gemini/compareClient";
import { diagnoseWithGemini } from "./gemini/diagnosisClient";
import { exploreWithGemini } from "./gemini/ideaExplorer";
import { generateSvgWithGemini } from "./gemini/svgGenerator";

const activeProviderConfig: ProviderConfig = providerConfig;

export async function explore(input?: ExploreInput): Promise<ExploreResult> {
  if (activeProviderConfig.layout === "dify") {
    if (!input) {
      throw new Error("Explore input is required for live providers.");
    }
    const missing = missingDifySettings("layout");
    if (missing.length > 0) {
      if (isRuntimeApiMode()) throw new Error(createMissingApiReason("Dify layout", missing));
      return attachProviderMeta(await demoExplore(input), "dify", createMissingApiReason("Dify layout", missing));
    }
    return withDemoFallback("dify", () => exploreLayoutWithDify(input), () => demoExplore(input));
  }
  if (activeProviderConfig.copy === "dify" || hasDifyWorkflowSettings("ideaExplorer")) {
    if (!input) {
      throw new Error("Explore input is required for live providers.");
    }
    const missing = missingDifySettings("copy");
    if (missing.length > 0) {
      if (isRuntimeApiMode()) throw new Error(createMissingApiReason("Dify copy", missing));
      return attachProviderMeta(await demoExplore(input), "dify", createMissingApiReason("Dify copy", missing));
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
  if (input && hasGeminiSettings()) {
    return exploreWithGemini(input);
  }
  if (isRuntimeApiMode()) {
    throw new Error("探索AIが未設定です。Dify Idea Explorer workflow、またはGemini API Keyを設定してください。");
  }
  return demoExplore(input);
}

export async function generateSvg(direction: Direction): Promise<SvgCandidate> {
  if (activeProviderConfig.svg === "gemini" || hasGeminiSettings()) {
    const missing = missingGeminiSettings();
    if (missing.length > 0) {
      if (isRuntimeApiMode()) throw new Error(createMissingApiReason("Gemini", missing));
      return attachProviderMeta(await demoGenerateSvg(direction), "gemini", createMissingApiReason("Gemini", missing));
    }
    return withDemoFallback("gemini", () => generateSvgWithGemini(direction), () => demoGenerateSvg(direction));
  }
  if (isRuntimeApiMode()) {
    throw new Error("SVG生成AIが未設定です。Gemini API Keyを設定してください。");
  }
  return demoGenerateSvg(direction);
}

export async function diagnose(frame: FigmaFrameData, contentType: ContentType, ruleCheck?: RuleCheckReport): Promise<DiagnosisResult> {
  if (activeProviderConfig.diagnosis === "dify" || hasDifyWorkflowSettings("diagnosis")) {
    const missing = missingDifySettings("diagnosis");
    if (missing.length > 0) {
      if (isRuntimeApiMode()) throw new Error(createMissingApiReason("Dify diagnosis", missing));
      return attachProviderMeta(await demoDiagnose(frame, contentType, ruleCheck), "dify", createMissingApiReason("Dify diagnosis", missing));
    }
    return withDemoFallback("dify", () => diagnoseWithDify(frame, contentType, ruleCheck), () => demoDiagnose(frame, contentType, ruleCheck));
  }
  if (hasGeminiSettings()) {
    return diagnoseWithGemini(frame, contentType, ruleCheck);
  }
  if (isRuntimeApiMode()) {
    throw new Error("診断AIが未設定です。Dify Diagnosis workflow、またはGemini API Keyを設定してください。");
  }
  return demoDiagnose(frame, contentType, ruleCheck);
}

export async function compare(
  frames: FigmaFrameData[],
  contentType: ContentType,
  frameSummaries?: FrameCompareSummary[],
): Promise<ComparisonResult> {
  if (activeProviderConfig.compare === "dify" || hasDifyWorkflowSettings("compare")) {
    const missing = missingDifySettings("compare");
    if (missing.length > 0) {
      if (isRuntimeApiMode()) throw new Error(createMissingApiReason("Dify compare", missing));
      return attachProviderMeta(await demoCompare(frames, contentType, frameSummaries), "dify", createMissingApiReason("Dify compare", missing));
    }
    return withDemoFallback("dify", () => compareWithDify(frames, contentType, frameSummaries), () => demoCompare(frames, contentType, frameSummaries));
  }
  if (hasGeminiSettings()) {
    return compareWithGemini(frames, contentType, frameSummaries);
  }
  if (isRuntimeApiMode()) {
    throw new Error("比較AIが未設定です。Dify Compare workflow、またはGemini API Keyを設定してください。");
  }
  return demoCompare(frames, contentType, frameSummaries);
}

export async function generateBackground(brief: BackgroundBrief): Promise<BackgroundResult> {
  if (activeProviderConfig.background === "gemini" || hasGeminiSettings()) {
    const missing = missingGeminiSettings();
    if (missing.length > 0) {
      if (isRuntimeApiMode()) throw new Error(createMissingApiReason("Gemini", missing));
      return attachProviderMeta(await demoGenerateBackground(brief), "gemini", createMissingApiReason("Gemini", missing));
    }
    return withDemoFallback("gemini", () => generateBackgroundWithGemini(brief), () => demoGenerateBackground(brief));
  }
  if (isRuntimeApiMode()) {
    throw new Error("背景生成AIが未設定です。Gemini API Keyを設定してください。");
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
    if (!activeProviderConfig.fallbackToDemo || isRuntimeApiMode()) {
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
        provider: "demo",
        fallbackUsed: true,
        fallbackReason: `${provider}: ${reason}`,
      },
    };
  }
  return {
    ...value,
    providerMeta: {
      provider: "demo",
      fallbackUsed: true,
      fallbackReason: `${provider}: ${reason}`,
    },
  };
}

type DifyWorkflow = "copy" | "layout" | "diagnosis" | "compare";

function missingDifySettings(workflow: DifyWorkflow): string[] {
  const settings: Record<DifyWorkflow, Record<string, string>> = {
    copy: { DIFY_COPY_API_URL: env.DIFY_COPY_API_URL, DIFY_COPY_API_KEY: env.DIFY_COPY_API_KEY },
    layout: { DIFY_LAYOUT_API_URL: env.DIFY_LAYOUT_API_URL, DIFY_LAYOUT_API_KEY: env.DIFY_LAYOUT_API_KEY },
    diagnosis: { DIFY_DIAGNOSIS_API_URL: env.DIFY_DIAGNOSIS_API_URL, DIFY_DIAGNOSIS_API_KEY: env.DIFY_DIAGNOSIS_API_KEY },
    compare: { DIFY_COMPARE_API_URL: env.DIFY_COMPARE_API_URL, DIFY_COMPARE_API_KEY: env.DIFY_COMPARE_API_KEY },
  };
  return missingKeys(settings[workflow]);
}

function missingGeminiSettings(): string[] {
  return missingKeys({ GEMINI_API_KEY: env.GEMINI_API_KEY });
}

function missingKeys(values: Record<string, string>): string[] {
  return Object.entries(values)
    .filter(([, value]) => value.trim().length === 0)
    .map(([key]) => key);
}

function createMissingApiReason(label: string, missing: string[]): string {
  return `${label} API設定が未設定です: ${missing.join(", ")}。設定画面で接続情報を確認してください。`;
}
