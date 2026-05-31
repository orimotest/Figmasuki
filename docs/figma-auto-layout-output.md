# Figma Auto Layout Output

Figma canvas output should be reviewable and editable, not a flat image dump.

## Current Auto Layout Board

`src/plugin/figma/renderRequirementDocumentBoard.ts` creates `00 Requirement Document Board` with Auto Layout:

- board frame: vertical Auto Layout
- summary row: horizontal Auto Layout
- requirement cards: vertical Auto Layout
- table rows: horizontal Auto Layout
- editable text nodes for headings, body, lists, quotes, code, and tables

`src/plugin/figma/renderProcessBoard.ts` also creates `00 Production Timeline`:

- board frame: vertical Auto Layout
- project summary row: horizontal Auto Layout
- eight production step rows with status badges
- readable summaries for requirements, exploration, typography, refined SVGs, compare, backgrounds, Final Candidates, and Figma output

## Board Naming

- `00 Requirement Document Board`
- `00 Production Timeline`
- `01 Project Header`
- `02 30 Ideas Explore`
- `03 15 Typography Drafts`
- `04 5 Refined SVGs`
- `05 Compare Result`
- `06 Background Variations`
- `07 Final Candidate`

## Layout Rules

- Use consistent padding and gap values.
- Prefer Auto Layout for document-like boards and cards.
- Keep text editable.
- Keep generated SVG candidates as editable SVG nodes when possible.
- Avoid raw JSON as user-facing output.
- Use clear layer names such as `Requirement / heading`, `Metric / Target`, and `Table Row 1`.

## Next Improvements

- Gradually migrate existing process boards from manual coordinates to Auto Layout sections.
- Keep 800x450 creative frames fixed.
- Preserve left-to-right stage placement on the Figma canvas.
