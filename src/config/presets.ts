import type { ContentType } from "../schemas/content";

export type ContentPreset = {
  contentType: ContentType;
  label: string;
  description: string;
};

export const contentPresets: ContentPreset[] = [
  {
    contentType: "note_thumbnail",
    label: "note / ブログサムネイル",
    description: "記事一覧やSNS共有で、読みたくなる入口を作ります。",
  },
  {
    contentType: "seminar_banner",
    label: "セミナー / ウェビナーバナー",
    description: "タイトル、日時、参加メリット、CTAを整理します。",
  },
];
