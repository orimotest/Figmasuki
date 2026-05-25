# New Workflow

AI Cover Studioは、以下の段階型フローで制作プロセスをFigma上に残します。

1. 30案探索
2. 15案文字組みドラフトSVG
3. 5案高品質SVG
4. 診断
5. 比較
6. 背景画像3案
7. 最終案

## A1 / 30案探索

Difyでコピー、訴求軸、トーン、レイアウト方向を30案広げます。

出力:

- `ideaDirections`
- `mainCopy`
- `subCopy`
- `cta`
- `intent`
- `tone`
- `layoutHint`
- `risk`
- `bestFor`
- `status`

## A2 / 15 Typography Draft

30案から代表性のある15案を残し、文字組み確認用のSVGを作ります。

このSVGは完成デザインではありません。見るべきものは、見出し位置、CTA位置、日時情報、余白、情報優先順位です。

## A3 / 5 Refined SVG

15案から5案に絞り、Geminiで高品質SVGへ仕上げます。

5案は、左寄せ、中央配置、左右分割、余白型、CTA強調型など、比較できる差を持たせます。

## Background Finish

Primary案にだけ背景3案を生成します。背景は文字やCTAを壊さず、Figma上で編集可能なテキストレイヤーを残します。
