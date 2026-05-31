export const difyCommonContract = `Figma Cover Studio API contract.
Return JSON only. Do not include markdown, code fences, commentary, apologies, or prose outside JSON.
The demo data is the ideal reference: API output must keep the same editable Figma-friendly structure, not a loose idea memo.
Canvas is 800x450. Safe area is x=48 y=40 width=704 height=370.
Do not declare a winner, CVR, or guaranteed result. Use primary/secondary/reason/risk language.
Keep text editable downstream. Do not ask Dify to flatten text into images.
Do not put internal labels into final creative output. Labels such as "参加メリット型", "課題共感型", "実務ノウハウ型", "Webinar", "Primary", "Secondary", or "Draft" are for workflow records only, not for the SVG itself.`;

export const directionContract = `Direction schema. Return exactly this shape for each direction:
{
  "id": "api_direction_01",
  "contentType": "seminar_banner | note_thumbnail",
  "title": "課題共感型",
  "name": "課題共感型",
  "summary": "短い役割説明",
  "intent": "この案で何を検討するか",
  "layoutType": "problem_to_cta | benefit_first | practical_blocks | trust_editorial | beginner_friendly | editorial_whitespace | statement_contrast | quiet_statement",
  "tone": ["friendly", "trustworthy"],
  "copy": {
    "main": "1-2行の主見出し",
    "sub": "短い補助コピー",
    "headline": "主見出しと同じ内容",
    "subheadline": "補助コピーと同じ内容",
    "cta": "短いCTA"
  },
  "layoutBrief": {
    "id": "layout_api_direction_01",
    "contentType": "seminar_banner | note_thumbnail",
    "title": "レイアウト名",
    "description": "配置の説明",
    "composition": "Figma上で再現できる構成",
    "hierarchy": ["main", "sub", "meta", "cta"],
    "constraints": ["safe area内に重要情報を入れる", "CTAの文字に十分な余白を持たせる"]
  },
  "styleBrief": {
    "mood": "calm tech",
    "palette": ["#EFF6FF", "#1E3A8A", "#16A34A", "#FFFFFF"],
    "typography": "bold Japanese sans-serif with clear hierarchy",
    "visualMotifs": ["soft geometric shapes"]
  },
  "rationale": "この案を残す理由",
  "riskNote": "懸念",
  "tags": ["初心者向け", "信頼感"]
}`;

export const demoIdealTemplateContract = `Ideal layout families:
- problem_to_cta: question headline, clear subcopy, date/meta, CTA with generous padding.
- benefit_first: value-first headline, benefit text or small cards, CTA separated from dense text.
- practical_blocks: practical learning points, high contrast, CTA not touching the edge.
- trust_editorial: calm B2B editorial layout, lower visual noise, clear date/meta.
- beginner_friendly: warm beginner tone, simple headline, reassuring CTA.

Final SVG rules:
- Do not render internal concept badges such as "参加メリット型" or "Webinar".
- The final SVG should contain only viewer-facing content: main copy, subcopy, date/time/place, benefit information, and CTA.
- Keep CTA, title, subcopy, and meta separated. No overlap.
- Prefer simple layouts that can be inspected in Figma over decorative UI-heavy compositions.

CTA rules:
- Keep button label short.
- Reserve at least 24px horizontal padding and 10px vertical padding.
- Do not overlap text with icons.
- Keep CTA inside safe area.`;

export const typographyDraftContract = `Typography Draft schema:
{
  "drafts": [
    {
      "id": "draft_01",
      "sourceIdeaId": "api_direction_01",
      "layoutType": "left_hero | center_focus | split_panel | card_stack | cta_emphasis | editorial_whitespace | dark_center | trust_panel | beginner_soft | meta_first",
      "name": "短い案名",
      "mainCopy": "主見出し",
      "subCopy": "補助コピー",
      "cta": "CTA",
      "date": "6.18 WED",
      "time": "14:00-15:00",
      "tone": "friendly",
      "priority": ["main", "sub", "date", "cta"],
      "layoutReason": "選んだ文字組み理由",
      "risk": "懸念"
    }
  ]
}
Typography drafts are not final creatives. They are simple review boards for line breaks, hierarchy, whitespace, meta position, and CTA text. Do not ask for complex decoration or button-heavy layouts.`;

export const candidateSelectionContract = `Candidate selection schema:
{
  "selected": [
    {
      "draftId": "draft_01",
      "reason": "5案に残す理由",
      "designDirection": "Gemini SVGへ渡す具体的なデザイン方向"
    }
  ],
  "rejectedOrMerged": [
    { "draftId": "draft_08", "reason": "統合または除外した理由" }
  ]
}
selected must contain exactly 5 items.`;
