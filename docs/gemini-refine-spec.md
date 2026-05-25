# Gemini Refine Spec

Geminiは仕上げ工程を担当します。

## Gemini 1: 5案高品質SVG化

入力:

- 5 refined targets
- Typography Draft SVG
- copy
- layoutHint
- styleBrief

出力:

- 5 high quality SVG
- 800x450
- viewBox `0 0 800 450`
- text要素あり
- foreignObjectなし
- scriptなし
- external imageなし

## Gemini 2: 背景画像3案

入力:

- Primary案
- background brief
- avoid
- safeAreaHint

出力:

- 背景案A: Soft Tech Gradient
- 背景案B: Subtle Geometry
- 背景案C: Editorial Texture

背景は文字やCTAを壊さないようにし、テキストはFigma上で編集可能なまま残します。
