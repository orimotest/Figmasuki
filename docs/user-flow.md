# User Flow

AI Cover Studio is centered on one primary path: input requirements, run auto production, and review the process on the Figma canvas.

## Sidebar

- 自動制作: main flow from requirements to Final Candidates.
- 要件入力: input source selection and requirement normalization.
- 診断: detail view for one selected or generated candidate.
- 比較: detail view for comparing two to five candidates.
- 仕上げ: detail view for background and Final Candidate review.
- Figma出力: canvas record status and full-process output.
- 設定: API and provider connection drawer.

## Main Flow

1. User opens 要件入力.
2. User chooses an input source: minimal prompt, brief text, fixed copy, PDF, Markdown, or existing Figma frame.
3. The app normalizes the input into `NormalizedCreativeInput`.
4. User starts 自動制作.
5. The app records a Requirement Document Board and a Production Timeline overview, then process boards for ideas, typography drafts, refined SVGs, comparison, backgrounds, and Final Candidates.
6. 診断 / 比較 / 仕上げ remain available as detail and rerun tools after the automated pass.

## Design Rule

The sidebar is the main navigation. Horizontal tabs should not be the primary flow because the Figma plugin window is narrow and the user needs stable orientation.
