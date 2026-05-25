# Dify Workflow Spec

Difyは大量探索と整理を担当します。完成SVGの自由生成ではなく、Geminiへ渡す前の構造化を主な責務にします。

## Dify 1: 30案探索

入力:

- `contentType`
- `inputMode`
- `briefText`
- `fixedCopy`
- `targetAudience`
- `tone`
- `canvasSize`
- `safeArea`

出力:

- `ideaDirections`: 30件
- 各案の `id`
- `name`
- `mainCopy`
- `subCopy`
- `cta`
- `intent`
- `tone`
- `layoutHint`
- `risk`
- `bestFor`

## Dify 2: 15案へ整理

入力:

- 30件の `ideaDirections`

出力:

- 15件の代表案
- `status`: `selected_for_typography` / `merged` / `rejected`
- `selectionReason`

目的は、似た案をまとめ、文字組みドラフトで比較する価値がある15案へ絞ることです。

## Dify 3: Typography Draft Layout JSON

採用方針として、Difyには自由なSVGを丸ごと書かせません。

DifyはLayout Draft JSONを返し、プラグイン側でテンプレートから安定したSVGを生成します。

入力:

- 15件のselected ideas
- 利用可能な `layoutType`
- `canvasSize`: 800x450
- `safeArea`: 704x370

出力:

```json
{
  "id": "draft_01",
  "sourceIdeaId": "idea_seminar_problem_01_1",
  "contentType": "seminar_banner",
  "layoutType": "left_hero",
  "directionName": "最初の壁をほどく",
  "mainCopy": "AI活用、何から始める？",
  "subCopy": "明日から使える実践ステップを60分で解説",
  "cta": "無料で参加する",
  "date": "6.18 WED",
  "time": "14:00 Online",
  "tone": "やさしい / 共感",
  "priority": ["main", "sub", "date", "cta"],
  "evaluationMemo": "主見出しとCTAの読み順を素直に確認できます。",
  "selectedForRefine": true
}
```

利用可能な `layoutType`:

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

## Dify 4: 5案選定

入力:

- 15件のLayout Draft JSON
- プラグイン側で生成されたTypography Draft SVG
- selection criteria

出力:

- 5件のrefined targets
- 選定理由
- Geminiへ渡すbrief

選定では、5案が似すぎないことを重視します。最低限、以下の方向性差を残してください。

- 課題共感型 / 左寄せ / やさしい導入
- 参加メリット型 / 左右分割 / 情報整理
- 実務ノウハウ型 / 中央配置 / 濃色または強い印象
- 信頼感型 / BtoB / 余白と落ち着き
- 初心者歓迎型 / やわらかい色 / 丸み

## Dify 5: 診断コメント生成

入力:

- 選択フレームの解析結果
- contentType
- ruleCheck

出力:

- 診断概要
- 最初に伝わること
- 強い点
- 気になる点
- 最初に直すなら
- 派生案

点数中心ではなく、判断材料として返します。

## Dify 6: 比較コメント生成

入力:

- 2から5案の候補情報
- copy direction
- layout type
- role
- ruleCheckまたはmetadata

出力:

- 比較概要
- 各案の役割
- 強み
- 懸念
- 向いている用途
- Primary候補
- Secondary候補
- 選定理由
- `backgroundBrief`

## fallback

Dify API URLまたはAPI Keyが空の場合、またはDifyが失敗した場合はDemo Modeにfallbackします。UIにはfallback理由を表示し、自動制作ジョブは可能な限り継続します。
