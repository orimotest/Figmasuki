# Gemini Integration

Geminiは、AI Cover StudioのLive Modeで以下を担当します。

1. 5案の高品質SVG化
2. Primary案に対する背景3案生成

30案探索や15案文字組みドラフト全件はGeminiに渡しません。Geminiに渡すのは、Dify Candidate Selectorで選ばれた5案だけです。

## 5案SVG refineの入力

```json
{
  "selectedCandidateId": "draft_01",
  "contentType": "seminar_banner",
  "canvasSize": { "width": 800, "height": 450 },
  "safeArea": { "x": 48, "y": 40, "width": 704, "height": 370 },
  "mainCopy": "AI活用、何から始める？",
  "subCopy": "明日から使える実践ステップを60分で解説",
  "cta": "無料で参加する",
  "date": "6.18 WED",
  "time": "14:00-15:00",
  "layoutType": "left_hero",
  "typographyDraftSvg": "<svg ...>",
  "layoutReason": "課題共感を入口にし、CTAまで自然に流すため",
  "tone": "friendly",
  "designDirection": "やさしい導入 / 左寄せ / 青アクセント",
  "avoidRules": ["foreignObject", "script", "external image", "text as path"]
}
```

## SVG生成Prompt

```text
You are a senior SVG designer for editable Figma banner layouts.

Create one editable SVG banner.

Requirements:
- Canvas: 800x450
- Include width="800", height="450", viewBox="0 0 800 450"
- Use editable <text> elements
- Do not convert text to paths
- Do not use foreignObject
- Do not use script
- Do not use external image URLs
- Do not include logos or watermarks
- Group layers with g id: background, headline, subcopy, meta, cta, decoration
- Keep main text and CTA inside safe area x=48 y=40 width=704 height=370
- Use rect + text for CTA
- Use Japanese text exactly as provided unless the input says copy can be changed
- Make this candidate visually distinct from the other four candidates

Return only the SVG code. Do not include Markdown.
```

## SVG validation

Plugin側で以下を確認します。

- `<svg` がある
- `</svg>` がある
- `viewBox="0 0 800 450"` がある
- `width="800"` / `height="450"` がある、またはviewBoxが正しい
- `text` 要素がある
- `foreignObject` がない
- `script` がない
- external image URLがない
- 長すぎない / 短すぎない

## 背景生成の入力

```json
{
  "primaryCandidate": {
    "id": "AI_SEMINAR_problem_01",
    "svg": "<svg ...>",
    "layoutType": "left_hero",
    "mainCopy": "AI活用、何から始める？",
    "cta": "無料で参加する"
  },
  "backgroundBrief": {
    "mood": "calm tech / trustworthy",
    "style": "soft tech gradient",
    "avoid": ["text", "logo", "watermark", "busy details"],
    "safeAreaHint": "主見出しとCTAの背面は低コントラストにする"
  },
  "noText": true,
  "noLogo": true
}
```

## 背景生成Prompt

```text
Create three background-only variations for an editable Figma banner.

Rules:
- No text
- No logo
- No watermark
- Do not place important detail behind headline or CTA safe area
- Keep the center and text area calm
- Background should be usable as a layer behind existing editable text
- Generate three directions:
  1. Soft Tech Gradient
  2. Subtle Geometry
  3. Editorial Texture
```

## 失敗時のfallback

- Gemini SVG refine失敗: 該当案だけDemo refined SVGまたはTypography Draft SVGへfallback
- 5案のうち1案が失敗しても他4案は継続
- 背景生成失敗: Demo background variationsへfallback
- fallbackはProduction Timelineと詳細ログで確認

## 検証手順

1. 1案だけSVG refineを実行
2. SVG validationを通す
3. Figmaに貼り付け
4. 5案一括で実行
5. 背景3案を生成
6. Final Candidate Boardで確認
