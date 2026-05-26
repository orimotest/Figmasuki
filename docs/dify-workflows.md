# Dify Workflows

AI Cover StudioのLive Modeでは、Difyを「大量探索と判断コメント生成」、Geminiを「5案SVG refineと背景生成」に分けます。

## 共通ルール

- 出力はJSONのみ
- Markdown説明文を混ぜない
- 点数中心にしない
- 「勝ち案」「正解」「CVRが上がる」など断定表現を使わない
- Primary / Secondary、ベース候補、次点候補、向いている用途、改善余地という言葉を使う
- 800x450固定、safe area 704x370を前提にする

## 1. Input Organizer

PDF、要件テキスト、確定コピー、最低限入力、Figma参考案を `NormalizedCreativeInput` に整理します。

Input:

```json
{
  "inputSource": "brief_text",
  "contentType": "seminar_banner",
  "canvasSize": { "width": 800, "height": 450 },
  "safeArea": { "x": 48, "y": 40, "width": 704, "height": 370 },
  "briefText": "オンラインセミナー集客用のバナー...",
  "fixedCopy": null,
  "pdfText": "",
  "referenceFrameSummary": ""
}
```

Output:

```json
{
  "inputSource": "brief_text",
  "contentType": "seminar_banner",
  "canvasSize": { "width": 800, "height": 450 },
  "safeArea": { "x": 48, "y": 40, "width": 704, "height": 370 },
  "projectName": "オンラインセミナー集客バナー",
  "goal": "短時間で学べる価値を伝え、申込につなげる",
  "target": "忙しいビジネスパーソン",
  "tone": "信頼感と親しみやすさ",
  "requiredInfo": ["mainCopy", "subCopy", "cta", "date", "time"],
  "missingInfo": ["date", "time"],
  "assumptions": ["日時は仮で6.18 WED 14:00-15:00として扱う"]
}
```

System Prompt:

```text
あなたは広告・バナー制作の要件整理担当です。
入力が少なくても制作を止めず、不足情報はassumptionsとして仮説補完してください。
出力はNormalizedCreativeInput JSONのみ。説明文やMarkdownを混ぜないでください。
```

## 2. Idea Explorer

NormalizedCreativeInputから30案のコピー・訴求軸・トーン・レイアウト方向を探索します。

Output:

```json
{
  "exploredCount": 30,
  "directions": [
    {
      "id": "idea_01",
      "name": "課題共感型",
      "mainCopy": "AI活用、何から始める？",
      "subCopy": "明日から使える実践ステップを60分で解説",
      "cta": "無料で参加する",
      "intent": "AI活用に不安がある人へ、最初の一歩をやさしく提示する",
      "tone": "friendly",
      "layoutHint": "left_hero",
      "risk": "やや一般的に見える可能性",
      "bestFor": "初心者向けの導入セミナー"
    }
  ]
}
```

System Prompt:

```text
あなたはコピー・訴求軸探索担当です。
30案は似すぎないよう、課題共感、参加メリット、実務ノウハウ、信頼感、初心者歓迎、時間価値などに分散してください。
出力はJSONのみ。
```

## 3. Typography Planner

30案から15案を選び、SVGではなくLayout Draft JSONを返します。Difyに自由なSVGは作らせません。

Output:

```json
{
  "drafts": [
    {
      "id": "draft_01",
      "sourceIdeaId": "idea_01",
      "layoutType": "left_hero",
      "name": "課題共感・左寄せ",
      "mainCopy": "AI活用、何から始める？",
      "subCopy": "明日から使える実践ステップを60分で解説",
      "cta": "無料で参加する",
      "date": "6.18 WED",
      "time": "14:00-15:00",
      "tone": "friendly",
      "priority": ["main", "sub", "date", "cta"],
      "layoutReason": "課題共感を入口にし、CTAまで自然に流すため",
      "risk": "やや一般的に見える可能性"
    }
  ]
}
```

利用できる `layoutType`:

- `left_hero`
- `center_focus`
- `split_panel`
- `card_stack`
- `cta_emphasis`
- `editorial_whitespace`
- `dark_center`
- `trust_panel`
- `beginner_soft`
- `meta_first`

System Prompt:

```text
あなたは文字組みドラフトの設計担当です。
SVGを出力せず、Layout Draft JSONのみ返してください。
各draftにはlayoutType、コピー、CTA、日時、priority、layoutReason、riskを必ず含めます。
```

## 4. Candidate Selector

15案から5案を選びます。5案は比較できるように構図、色、トーンが偏らないようにします。

Output:

```json
{
  "selected": [
    {
      "draftId": "draft_01",
      "reason": "課題共感の入口として強く、初心者向けに使いやすい",
      "designDirection": "やさしい導入 / 左寄せ / 青アクセント"
    }
  ],
  "rejectedOrMerged": [
    { "draftId": "draft_08", "reason": "draft_01と訴求が近いため統合" }
  ]
}
```

## 5. Diagnosis

選択された1案の診断コメントを生成します。

Output:

```json
{
  "summary": "AI活用の入口として分かりやすい案です。",
  "firstImpression": "最初にAI活用の始め方を学べるセミナーだと伝わります。",
  "strengths": ["問いかけで関心を引ける", "CTAが見つけやすい"],
  "concerns": ["日時情報が弱い", "やや一般的に見える可能性"],
  "fixPriority": [
    { "target": "日時", "issue": "見つけにくい", "suggestion": "日時を独立したチップにする", "priority": "high" }
  ],
  "rewriteInstructions": [
    { "label": "日時強調案", "instruction": "日時を下部の独立ブロックにする", "targetWorkflow": "generate_svg" }
  ]
}
```

## 6. Compare

5案を比較し、Primary / Secondary / backgroundBriefを返します。

Output:

```json
{
  "comparisonSummary": "課題共感型は集客入口として強く、参加メリット型は内容理解に向いています。",
  "frameRoles": [
    {
      "frameId": "AI_SEMINAR_problem_01",
      "frameName": "課題共感型",
      "role": "入口訴求",
      "bestFor": "初心者向け集客",
      "strength": "問いかけで関心を引きやすい",
      "risk": "具体性が弱く見える可能性",
      "note": "ベース候補として扱いやすい"
    }
  ],
  "recommendation": {
    "primaryFrameId": "AI_SEMINAR_problem_01",
    "primaryReason": "入口として強く、初心者向けの心理的ハードルを下げられる",
    "secondaryFrameId": "AI_SEMINAR_benefit_02",
    "secondaryReason": "内容理解と申込導線の参考にできる"
  },
  "backgroundBrief": {
    "mood": "calm tech / trustworthy",
    "style": "soft tech gradient",
    "avoid": ["文字生成", "ロゴ", "過度に細かい装飾"],
    "safeAreaHint": "主見出しとCTAの背面は低コントラストにする",
    "suggestedStyleKeywords": ["soft tech gradient", "business calm", "low contrast center"]
  }
}
```
