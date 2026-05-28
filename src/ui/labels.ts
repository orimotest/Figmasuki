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
  Settings: {
    label: "設定",
    description: "Dify / Geminiの接続情報と実行モードを確認します。",
    shortDescription: "API接続",
  },
};

export const contentTypeLabels: Record<ContentType, string> = {
  note_thumbnail: "note / ブログサムネイル",
  seminar_banner: "セミナー / ウェビナーバナー",
};

export const inputModeLabels: Record<InputMode, string> = {
  minimal_prompt: "おまかせで作る",
  brief_text: "要件テキストから作る",
  fixed_copy: "確定コピーから作る",
  pdf: "PDF / 資料から作る",
  figma_reference: "既存Figma案を参考にする",
  figma_variation: "既存Figma案を参考にする",
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
