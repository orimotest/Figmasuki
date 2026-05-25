import type { ContentType } from "./content";

export type TypographyDraftLayoutType =
  | "left_hero"
  | "center_focus"
  | "split_panel"
  | "card_stack"
  | "cta_emphasis"
  | "editorial_whitespace"
  | "dark_center"
  | "trust_panel"
  | "beginner_soft"
  | "meta_first";

export type LayoutDraftPriority = "main" | "sub" | "date" | "time" | "cta" | "meta";

export type LayoutDraftInput = {
  id: string;
  sourceIdeaId: string;
  contentType: ContentType;
  layoutType: TypographyDraftLayoutType;
  directionName: string;
  mainCopy: string;
  subCopy: string;
  cta?: string;
  date?: string;
  time?: string;
  tone?: string;
  priority: LayoutDraftPriority[];
  evaluationMemo?: string;
  selectedForRefine?: boolean;
};

export const typographyDraftLayouts: TypographyDraftLayoutType[] = [
  "left_hero",
  "center_focus",
  "split_panel",
  "card_stack",
  "cta_emphasis",
  "meta_first",
  "editorial_whitespace",
  "dark_center",
  "trust_panel",
  "beginner_soft",
];

export const typographyDraftLayoutLabels: Record<TypographyDraftLayoutType, string> = {
  left_hero: "左寄せ",
  center_focus: "中央配置",
  split_panel: "左右分割",
  card_stack: "カード整理",
  cta_emphasis: "CTA強調",
  editorial_whitespace: "余白型",
  dark_center: "濃色中央",
  trust_panel: "信頼感パネル",
  beginner_soft: "初心者向け",
  meta_first: "開催情報優先",
};
