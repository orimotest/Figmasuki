import type { ContentType } from "../schemas/content";
import type { InputMode } from "../schemas/input";
import type { ProviderMode } from "../schemas/provider";
import type { AppTab } from "./components/TabNav";

export const tabLabels: Record<AppTab, { label: string; description: string; shortDescription: string }> = {
  Brief: {
    label: "要件",
    description: "制作前のブリーフを整理します。まずは作りたい内容だけを書けば、詳細条件はあとから調整できます。",
    shortDescription: "ブリーフ作成",
  },
  Explore: {
    label: "制作",
    description: "要件をもとに比較・背景画像生成・最終候補のFigma記録まで一括で進行します。",
    shortDescription: "画像生成まで完走",
  },
  Compare: {
    label: "評価",
    description: "選択したFigmaフレームや制作済み案を、単体ツールとして比較・評価できます。",
    shortDescription: "単体評価ツール",
  },
};

export const contentTypeLabels: Record<ContentType, string> = {
  note_thumbnail: "note / ブログサムネイル",
  seminar_banner: "セミナー / ウェビナーバナー",
};

export const inputModeLabels: Record<InputMode, string> = {
  minimal_prompt: "AIに自動生成",
  brief_text: "テキスト入力",
  fixed_copy: "テキスト入力",
  pdf: "PDFから生成",
  markdown: "Markdownから生成",
  figma_reference: "Figma案を参考",
  figma_variation: "Figma案を参考",
};

export const providerLabels: Record<ProviderMode, string> = {
  demo: "代替処理",
  dify: "Dify",
  gemini: "Gemini",
};

export const workflowLabels = {
  processBoard: "プロセスボードをFigmaに作成",
  fullProcessBoard: "一連のプロセスをFigmaに出力",
  insertAllCandidates: "5案をまとめてFigmaに配置",
  reset: "結果をリセット",
};
