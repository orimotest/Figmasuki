# SVG Template Strategy

15案のTypography Draftは、Difyに自由なSVGを丸ごと書かせるのではなく、Difyが返すLayout Draft JSONをプラグイン側のテンプレートに流し込んでSVG化します。

## 判断

採用方針: `Layout Draft JSON + Plugin template`

理由:

- Figmaに貼るSVGの安定性を保ちやすい
- `800x450` / `viewBox="0 0 800 450"` / text要素あり、という制約を確実に守れる
- `foreignObject`、`script`、外部画像参照を避けられる
- 文字サイズ、余白、CTA位置、日時情報の比較に集中できる
- Dify workflowの出力が壊れても、fallbackやvalidationがしやすい
- Geminiへ渡す5案だけを高品質SVG化でき、コストと品質管理の両方で現実的

## Difyが返すJSON

Difyは15件のLayout Draft JSONを返します。SVG文字列は返さなくて構いません。

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

## 対応テンプレート

`src/schemas/layoutDraft.ts` の `TypographyDraftLayoutType` を正とします。

- `left_hero`: 左に大きなメインコピー、下にサブコピー、右下CTA
- `center_focus`: 中央にメインコピー、下部にメタ情報
- `split_panel`: 左にコピー、右に情報パネル
- `card_stack`: 学べる内容をカードで整理
- `cta_emphasis`: CTAの見つけやすさを検証
- `editorial_whitespace`: 余白を大きく取り、広告感を抑える
- `dark_center`: 濃色背景で強い印象と可読性を検証
- `trust_panel`: BtoB向けに落ち着いた信頼感を出す
- `beginner_soft`: 柔らかい色と丸みで初心者向けにする
- `meta_first`: 日時や開催情報を先に見せる

## 実装箇所

- schema: `src/schemas/layoutDraft.ts`
- SVG generator: `src/utils/typographyDraftSvg.ts`
- Demo data: `src/data/demo/stagedWorkflowDemo.ts`
- Figma board: `src/plugin/figma/renderProcessBoard.ts`

## Live API化するときの接続

1. Dify 30案探索で `ideaDirections` を返す
2. Dify 15案整理で `LayoutDraftInput[]` を返す
3. プラグイン側で `createTypographyDraftSvg()` を使って15件のDraft SVGを生成する
4. Difyまたはルールベースで5件の `selectedForRefine` を決める
5. Geminiへ5件のDraft SVGとLayout Draft JSONを渡し、高品質SVGを生成する

この流れにより、Difyには「判断と構造化」、Geminiには「視覚品質の向上」、Figmaプラグインには「安定したSVG生成と記録」を担当させます。
