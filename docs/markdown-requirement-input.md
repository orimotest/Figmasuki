# Markdown Requirement Input

Markdown input is an entry point for requirements copied from Notion, Google Docs, ChatGPT, web pages, or planning documents.

## Supported MVP Syntax

- `#`, `##`, `###` headings
- `-` and `*` unordered lists
- `1.` ordered lists
- `**bold**`, inline code, and links as plain readable text
- `>` quotes
- fenced code blocks
- pipe tables

## UI Behavior

The Markdown mode in 要件入力 shows a structure preview:

- heading count
- list item count
- table count
- parsed block count
- first few parsed blocks

This helps the user see whether pasted requirements are being understood before auto production starts.

## Workflow Behavior

Markdown is parsed by `src/utils/markdown/parseMarkdown.ts`.
`src/utils/markdown/normalizeRichText.ts` converts the parsed structure into plain text and block metadata.
Labeled lines such as `対象:`, `ターゲット:`, `目的:`, `訴求:`, `トーン:`, `CTA:`, and `日時:` are used during normalization so pasted Markdown is less likely to fall back to generic assumptions.
`NormalizedCreativeInput` stores:

- `markdownText`
- `requirementBlocks`

The auto production flow can then pass plain text to the AI providers while keeping the structured blocks for Figma output.

## Figma Output

`RENDER_REQUIREMENT_DOCUMENT_BOARD` creates a Requirement Document Board before the production boards. The board uses Figma Auto Layout and preserves requirement structure as editable text layers, cards, lists, quotes, code blocks, and tables.
