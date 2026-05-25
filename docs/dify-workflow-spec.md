# Dify Workflow Spec

Difyは大量探索と整理を担当します。Geminiへ渡す前の構造化が主な責務です。

## Dify 1: 30案探索

入力:

- contentType
- briefText
- targetAudience
- tone
- canvasSize

出力:

- 30件の `ideaDirections`
- copy
- intent
- tone
- layoutHint
- risk
- bestFor

## Dify 2: 15案へ整理

入力:

- 30 ideaDirections

出力:

- 15件の代表案
- status
- selectionReason

## Dify 3: Typography Draft SVG

入力:

- 15 selected ideas

出力:

- 15件の軽量SVG
- 800x450
- text中心
- foreignObjectなし
- scriptなし
- external imageなし

## Dify 4: 5案選定

入力:

- 15 typography drafts

出力:

- 5 refined targets
- 選定理由
- Geminiへ渡すbrief

## Dify 5 / 6: 診断・比較

診断と比較のコメント生成を担当します。点数ではなく、強み、懸念、修正方針を返します。
