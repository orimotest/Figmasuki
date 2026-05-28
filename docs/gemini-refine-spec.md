# Gemini Refine Spec

Geminiは視覚品質を上げる工程を担当します。Difyで30案や15案を大量に扱い、Geminiへ渡すのは5案に絞った後です。

## Gemini 1: 5案高品質SVG化

入力:

- 5件のrefined targets
- 対応するLayout Draft JSON
- 対応するTypography Draft SVG
- copy direction
- layoutHint
- styleBrief
- canvasSize: 800x450
- safeArea: 704x370

出力:

- 5 high quality SVG
- `width="800"` / `height="450"`
- `viewBox="0 0 800 450"`
- text要素あり
- `foreignObject` なし
- `script` なし
- 外部 `http(s)` image参照なし

5案は比較できるように、以下の差を維持します。

1. 課題共感型 / 左寄せ / やさしい導入
2. 参加メリット型 / 左右分割 / 情報整理
3. 実務ノウハウ型 / 中央配置 / 濃色または強い印象
4. 信頼感型 / BtoB / 余白と落ち着き
5. 初心者歓迎型 / やわらかい色 / 丸み / 安心感

## Gemini 2: 背景画像3案

入力:

- Primary案
- background brief
- avoid
- safeAreaHint
- selected refined SVG metadata

出力:

- 背景案A: Soft Tech Gradient
- 背景案B: Subtle Geometry
- 背景案C: Editorial Texture

背景は文字やCTAを壊さないようにします。テキスト、日時、CTAはFigma上で編集可能なまま残す方針です。

## validation

Geminiから返るSVGは、プラグイン側で以下を確認します。

- `<svg` がある
- `viewBox="0 0 800 450"` がある
- `text` 要素がある
- `foreignObject` がない
- `script` がない
- 外部 `http(s)` 参照がない

失敗した場合はDemo refined SVGまたはDemo backgroundへfallbackします。
## Button / Badge Layout Rules

GeminiにCTA、バッジ、ピル型ラベルを作らせる場合は、以下を必ず守ります。

- ラベルの左右には最低24px以上の余白を取る。
- ラベルの上下には最低10〜14pxの余白を取る。
- 日本語の1文字だけ改行を発生させない。
- テキストが角丸矩形の端に触れそうな場合は、ボタン幅を広げるか、フォントサイズを少し下げる。
- 矢印やアイコンを入れる場合は、右側に40〜56px程度の専用領域を確保し、テキストは残りのラベル領域の中央に置く。
- `letter-spacing` は `0` を基本にし、負の値は使わない。
- CTAは `rect + text` で作り、Figma上で編集しやすい構造にする。
