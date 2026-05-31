import type { RequirementBlock } from "../../schemas/input";
import { parseMarkdown } from "./parseMarkdown";

export type MarkdownRequirementSummary = {
  blocks: RequirementBlock[];
  plainText: string;
  headings: string[];
  listItemCount: number;
  tableCount: number;
};

export function normalizeRichTextInput(value: string): MarkdownRequirementSummary {
  const blocks = parseMarkdown(value);
  return {
    blocks,
    plainText: blocks.map((block) => block.text).join("\n"),
    headings: blocks.filter((block) => block.type === "heading").map((block) => block.text),
    listItemCount: blocks.reduce((count, block) => count + (block.items?.length ?? 0), 0),
    tableCount: blocks.filter((block) => block.type === "table").length,
  };
}
