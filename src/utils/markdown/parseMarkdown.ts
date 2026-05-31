import type { RequirementBlock } from "../../schemas/input";

export function parseMarkdown(markdown: string): RequirementBlock[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks: RequirementBlock[] = [];
  let blockIndex = 0;
  let paragraph: string[] = [];
  let listItems: string[] = [];
  let orderedItems: string[] = [];
  let quoteItems: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;
  let tableRows: string[][] = [];

  const createBlock = (type: RequirementBlock["type"], text: string): RequirementBlock => {
    blockIndex += 1;
    return {
      id: `${type}_${blockIndex}`,
      type,
      text,
    };
  };

  const flushParagraph = () => {
    if (!paragraph.length) return;
    blocks.push(createBlock("paragraph", stripInlineMarks(paragraph.join(" "))));
    paragraph = [];
  };

  const flushList = () => {
    if (listItems.length) {
      blocks.push({ ...createBlock("list", listItems.join("\n")), items: listItems });
      listItems = [];
    }
    if (orderedItems.length) {
      blocks.push({ ...createBlock("ordered_list", orderedItems.join("\n")), items: orderedItems });
      orderedItems = [];
    }
  };

  const flushQuote = () => {
    if (!quoteItems.length) return;
    blocks.push(createBlock("quote", stripInlineMarks(quoteItems.join("\n"))));
    quoteItems = [];
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    blocks.push({ ...createBlock("table", tableRows.map((row) => row.join(" | ")).join("\n")), rows: tableRows });
    tableRows = [];
  };

  const flushLooseBlocks = () => {
    flushParagraph();
    flushList();
    flushQuote();
    flushTable();
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      if (inCode) {
        blocks.push(createBlock("code", codeLines.join("\n")));
        codeLines = [];
      } else {
        flushLooseBlocks();
      }
      inCode = !inCode;
      return;
    }

    if (inCode) {
      codeLines.push(line);
      return;
    }

    if (!trimmed) {
      flushLooseBlocks();
      return;
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (heading) {
      flushLooseBlocks();
      blocks.push({ ...createBlock("heading", stripInlineMarks(heading[2])), level: heading[1].length as 1 | 2 | 3 });
      return;
    }

    if (isTableRow(trimmed)) {
      flushParagraph();
      flushList();
      flushQuote();
      const cells = trimmed
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => stripInlineMarks(cell.trim()));
      if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell))) tableRows.push(cells);
      return;
    }

    const unordered = /^[-*]\s+(.+)$/.exec(trimmed);
    if (unordered) {
      flushParagraph();
      flushQuote();
      flushTable();
      listItems.push(stripInlineMarks(unordered[1]));
      return;
    }

    const ordered = /^\d+\.\s+(.+)$/.exec(trimmed);
    if (ordered) {
      flushParagraph();
      flushQuote();
      flushTable();
      orderedItems.push(stripInlineMarks(ordered[1]));
      return;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      flushList();
      flushTable();
      quoteItems.push(stripInlineMarks(trimmed.replace(/^>\s?/, "")));
      return;
    }

    flushList();
    flushQuote();
    flushTable();
    paragraph.push(trimmed);
  });

  if (inCode && codeLines.length) blocks.push(createBlock("code", codeLines.join("\n")));
  flushLooseBlocks();
  return blocks;
}

export function stripInlineMarks(value: string): string {
  return value
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function isTableRow(value: string): boolean {
  return value.includes("|") && value.split("|").filter(Boolean).length >= 2;
}
