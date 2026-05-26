import { env } from "../../config/env";
import type { LayoutDraftInput, TypographyDraftLayoutType } from "../../schemas/layoutDraft";
import type { Direction } from "../../schemas/direction";
import { isRecord } from "../../utils/guards";
import { callDifyWorkflow } from "./difyClient";

const allowedLayoutTypes: TypographyDraftLayoutType[] = [
  "left_hero",
  "center_focus",
  "split_panel",
  "card_stack",
  "cta_emphasis",
  "editorial_whitespace",
  "dark_center",
  "trust_panel",
  "beginner_soft",
  "meta_first",
];

export async function planTypographyDraftsWithDify(directions: Direction[]): Promise<LayoutDraftInput[]> {
  const output = await callDifyWorkflow<Record<string, unknown>, unknown>({
    url: env.DIFY_TYPOGRAPHY_DRAFT_API_URL,
    apiKey: env.DIFY_TYPOGRAPHY_DRAFT_API_KEY,
    inputs: {
      directions,
      instruction: "Return Layout Draft JSON only. Do not return SVG.",
    },
  });

  const drafts = isRecord(output) && Array.isArray(output.drafts) ? output.drafts : Array.isArray(output) ? output : [];
  return drafts.map((draft, index) => normalizeDraft(draft, directions[index % Math.max(directions.length, 1)], index)).filter(Boolean) as LayoutDraftInput[];
}

function normalizeDraft(value: unknown, direction: Direction | undefined, index: number): LayoutDraftInput | null {
  if (!isRecord(value) && !direction) return null;
  const layoutType = isRecord(value) && typeof value.layoutType === "string" && allowedLayoutTypes.includes(value.layoutType as TypographyDraftLayoutType)
    ? (value.layoutType as TypographyDraftLayoutType)
    : ((direction?.layoutType as TypographyDraftLayoutType) || "left_hero");

  return {
    id: isRecord(value) && typeof value.id === "string" ? value.id : `draft_${String(index + 1).padStart(2, "0")}`,
    sourceIdeaId: isRecord(value) && typeof value.sourceIdeaId === "string" ? value.sourceIdeaId : direction?.id ?? `idea_${index + 1}`,
    contentType: direction?.contentType ?? "seminar_banner",
    layoutType,
    directionName: isRecord(value) && typeof value.name === "string" ? value.name : direction?.name ?? direction?.title ?? `Draft ${index + 1}`,
    mainCopy: isRecord(value) && typeof value.mainCopy === "string" ? value.mainCopy : direction?.copy.main ?? "",
    subCopy: isRecord(value) && typeof value.subCopy === "string" ? value.subCopy : direction?.copy.sub ?? "",
    cta: isRecord(value) && typeof value.cta === "string" ? value.cta : direction?.copy.cta,
    date: isRecord(value) && typeof value.date === "string" ? value.date : "6.18 WED",
    time: isRecord(value) && typeof value.time === "string" ? value.time : "14:00-15:00",
    tone: isRecord(value) && typeof value.tone === "string" ? value.tone : direction?.tone?.[0],
    priority: ["main", "sub", "date", "cta"],
    evaluationMemo: isRecord(value) && typeof value.layoutReason === "string" ? value.layoutReason : direction?.intent,
    selectedForRefine: Boolean(isRecord(value) && value.selectedForRefine),
  };
}
