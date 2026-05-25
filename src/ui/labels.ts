import type { ContentType } from "../schemas/content";
import type { InputMode } from "../schemas/input";
import type { ProviderMode } from "../schemas/provider";
import type { AppTab } from "./components/TabNav";

export const tabLabels: Record<AppTab, { label: string; description: string; shortDescription: string }> = {
  Explore: {
    label: "\u81ea\u52d5\u5236\u4f5c",
    description: "\u8981\u4ef6\u5165\u529b\u304b\u3089Final Candidate\u307e\u3067\u3001AI\u5236\u4f5c\u30b8\u30e7\u30d6\u3068\u3057\u3066\u81ea\u52d5\u9032\u884c\u3057\u307e\u3059\u3002",
    shortDescription: "\u6700\u7d42\u5019\u88dc\u307e\u3067",
  },
  Diagnose: {
    label: "\u8a3a\u65ad",
    description: "\u9078\u629e\u4e2d\u306e1\u6848\u3092\u8aad\u307f\u53d6\u308a\u3001\u4f1d\u308f\u308a\u65b9\u3068\u6700\u521d\u306b\u76f4\u3059\u70b9\u3092\u6574\u7406\u3057\u307e\u3059\u3002",
    shortDescription: "1\u6848\u3092\u8aad\u3080",
  },
  Compare: {
    label: "\u6bd4\u8f03",
    description: "2\u304b\u30895\u6848\u306e\u5f79\u5272\u3084\u5f37\u307f\u3092\u6bd4\u3079\u3001\u4ed5\u4e0a\u3052\u308b\u30d9\u30fc\u30b9\u6848\u3092\u9078\u3073\u3084\u3059\u304f\u3057\u307e\u3059\u3002",
    shortDescription: "\u8907\u6570\u6848\u3092\u6bd4\u3079\u308b",
  },
  Finish: {
    label: "\u4ed5\u4e0a\u3052",
    description: "\u9078\u3070\u308c\u305f\u6848\u3060\u3051\u306b\u3001\u6587\u5b57\u3092\u90aa\u9b54\u3057\u306a\u3044\u80cc\u666f\u65b9\u91dd\u3092\u9069\u7528\u3057\u307e\u3059\u3002",
    shortDescription: "\u80cc\u666f\u3067\u6574\u3048\u308b",
  },
};

export const contentTypeLabels: Record<ContentType, string> = {
  note_thumbnail: "note / \u30d6\u30ed\u30b0\u30b5\u30e0\u30cd\u30a4\u30eb",
  seminar_banner: "\u30bb\u30df\u30ca\u30fc / \u30a6\u30a7\u30d3\u30ca\u30fc\u30d0\u30ca\u30fc",
};

export const inputModeLabels: Record<InputMode, string> = {
  brief_text: "\u8981\u4ef6\u304b\u3089\u4f5c\u308b",
  fixed_copy: "\u78ba\u5b9a\u30b3\u30d4\u30fc\u304b\u3089\u4f5c\u308b",
  pdf: "PDF\u304b\u3089\u4f5c\u308b",
  figma_variation: "Figma\u6848\u304b\u3089\u6d3e\u751f",
};

export const providerLabels: Record<ProviderMode, string> = {
  demo: "demo",
  dify: "Dify",
  gemini: "Gemini",
};

export const workflowLabels = {
  processBoard: "\u30d7\u30ed\u30bb\u30b9\u30dc\u30fc\u30c9\u3092Figma\u306b\u4f5c\u6210",
  fullProcessBoard: "\u4e00\u9023\u306e\u30d7\u30ed\u30bb\u30b9\u3092Figma\u306b\u307e\u3068\u3081\u3066\u51fa\u529b",
  insertAllCandidates: "5\u6848\u3092\u307e\u3068\u3081\u3066Figma\u306b\u914d\u7f6e",
  reset: "\u7d50\u679c\u3092\u30ea\u30bb\u30c3\u30c8",
};
