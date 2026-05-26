import type { ContentType } from "../schemas/content";
import type { InputMode } from "../schemas/input";
import type { ProviderMode } from "../schemas/provider";
import type { AppTab } from "./components/TabNav";

export const tabLabels: Record<AppTab, { label: string; description: string; shortDescription: string }> = {
  Explore: {
    label: "自動制作",
    description: "要件入力からFinal Candidateまで、AI制作ジョブとして段階的に進行します。",
    shortDescription: "最終候補まで",
  },
  Diagnose: {
    label: "診断",
    description: "自動制作後の詳細確認として、選択中の1案の伝わり方と改善方針を整理します。",
    shortDescription: "1案を読む",
  },
  Compare: {
    label: "比較",
    description: "自動制作後の詳細確認として、複数案の役割、強み、向いている用途を比べます。",
    shortDescription: "複数案を比べる",
  },
  Finish: {
    label: "仕上げ",
    description: "比較で選ばれた案に対して、背景方針と最終候補を確認・再出力します。",
    shortDescription: "背景で整える",
  },
  Settings: {
    label: "設定",
    description: "Dify / Geminiの接続情報を保存し、実行モードを確認します。",
    shortDescription: "API設定",
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
  demo: "demo",
  dify: "Dify",
  gemini: "Gemini",
};

export const workflowLabels = {
  processBoard: "プロセスボードをFigmaに作成",
  fullProcessBoard: "一連のプロセスをFigmaに出力",
  insertAllCandidates: "5案をまとめてFigmaに配置",
  reset: "結果をリセット",
};
