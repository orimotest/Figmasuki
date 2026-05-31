import { CANVAS_SIZE } from "../../config/canvas";
import { env } from "../../config/env";
import type { Direction } from "../../schemas/direction";
import type { ExploreInput } from "../../schemas/input";
import { isRecord } from "../../utils/guards";
import { callDifyWorkflow } from "./difyClient";
import { demoIdealTemplateContract, difyCommonContract, directionContract } from "./difyPromptContracts";

export type CopyExploreOutput = {
  directions: Direction[];
};

export async function exploreCopyWithDify(input: ExploreInput): Promise<CopyExploreOutput> {
  const output = await callDifyWorkflow<Record<string, unknown>, unknown>({
    url: env.DIFY_COPY_API_URL,
    apiKey: env.DIFY_COPY_API_KEY,
    inputs: {
      contract: difyCommonContract,
      outputSchema: directionContract,
      idealTemplateReference: demoIdealTemplateContract,
      contentType: input.contentType,
      inputMode: input.inputMode,
      canvasSize: CANVAS_SIZE,
      safeArea: CANVAS_SIZE.safeArea,
      briefText: input.briefText ?? "",
      fixedCopy: input.fixedCopy ?? null,
    },
  });

  return { directions: normalizeDirections(output, input.contentType).slice(0, 5) };
}

export function normalizeDirections(value: unknown, fallbackContentType: Direction["contentType"] = "seminar_banner"): Direction[] {
  const rawDirections = isRecord(value) && Array.isArray(value.directions) ? value.directions : Array.isArray(value) ? value : [];
  return rawDirections.map((item, index) => normalizeDirection(item, index, fallbackContentType)).filter(Boolean) as Direction[];
}

function normalizeDirection(value: unknown, index: number, fallbackContentType: Direction["contentType"]): Direction | null {
  if (!isRecord(value)) return null;
  const id = readString(value.id, `dify_direction_${index + 1}`);
  const title = readString(value.title, readString(value.name, `Direction ${index + 1}`));
  const main = readNestedString(value.copy, "main") || readString(value.mainCopy, title);
  const sub = readNestedString(value.copy, "sub") || readString(value.subCopy, readString(value.summary, ""));
  const cta = readNestedString(value.copy, "cta") || readString(value.cta, fallbackContentType === "seminar_banner" ? "詳細を見る" : "");
  const layoutType = readString(value.layoutType, readString(value.layoutHint, "problem_to_cta"));
  const tone = Array.isArray(value.tone) ? value.tone.filter((item): item is string => typeof item === "string") : [readString(value.tone, "trustworthy")];

  return {
    id,
    contentType: value.contentType === "note_thumbnail" ? "note_thumbnail" : fallbackContentType,
    title,
    name: readString(value.name, title),
    summary: readString(value.summary, readString(value.bestFor, title)),
    intent: readString(value.intent, readString(value.layoutReason, "要件に沿った方向性を検討する")),
    layoutType,
    tone,
    copy: {
      main,
      sub,
      headline: readNestedString(value.copy, "headline") || main,
      subheadline: readNestedString(value.copy, "subheadline") || sub,
      cta,
    },
    layoutBrief: isRecord(value.layoutBrief)
      ? {
          id: readString(value.layoutBrief.id, `layout_${id}`),
          contentType: value.layoutBrief.contentType === "note_thumbnail" ? "note_thumbnail" : fallbackContentType,
          title: readString(value.layoutBrief.title, title),
          description: readString(value.layoutBrief.description, readString(value.layoutHint, "テンプレートに沿って構成する")),
          composition: readString(value.layoutBrief.composition, readString(value.layoutHint, "safe area内に主情報を配置する")),
          hierarchy: readStringArray(value.layoutBrief.hierarchy, ["main", "sub", "meta", "cta"]),
          constraints: readStringArray(value.layoutBrief.constraints, ["safe area内に重要情報を入れる", "CTAの文字余白を確保する"]),
        }
      : {
          id: `layout_${id}`,
          contentType: fallbackContentType,
          title,
          description: readString(value.layoutHint, "テンプレートに沿って構成する"),
          composition: readString(value.layoutHint, "safe area内に主情報を配置する"),
          hierarchy: ["main", "sub", "meta", "cta"],
          constraints: ["safe area内に重要情報を入れる", "CTAの文字余白を確保する"],
        },
    styleBrief: isRecord(value.styleBrief)
      ? {
          mood: readString(value.styleBrief.mood, readString(value.tone, "trustworthy")),
          palette: readStringArray(value.styleBrief.palette, ["#EFF6FF", "#1E3A8A", "#16A34A", "#FFFFFF"]),
          typography: readString(value.styleBrief.typography, "bold Japanese sans-serif"),
          visualMotifs: readStringArray(value.styleBrief.visualMotifs, ["subtle geometric accents"]),
        }
      : {
          mood: readString(value.tone, "trustworthy"),
          palette: ["#EFF6FF", "#1E3A8A", "#16A34A", "#FFFFFF"],
          typography: "bold Japanese sans-serif",
          visualMotifs: ["subtle geometric accents"],
        },
    rationale: readString(value.rationale, readString(value.reason, "比較価値を残すため")),
    riskNote: readString(value.riskNote, readString(value.risk, "Live provider returned no risk note.")),
    tags: readStringArray(value.tags, []),
  };
}

function readNestedString(value: unknown, key: string): string | undefined {
  if (!isRecord(value)) return undefined;
  return typeof value[key] === "string" && value[key].trim() ? value[key].trim() : undefined;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
  return items.length ? items : fallback;
}
