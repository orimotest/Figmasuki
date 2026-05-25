# Live APIフロー

このドキュメントは、Demo ModeからDify / Gemini連携へ差し替える時の接続方針です。

## 基本方針

UIは `ProductionStage` を進め、各stageの完了ごとにFigmaへ工程別ボードを記録します。

APIが未設定、またはAPI呼び出しに失敗した場合はDemo Modeにfallbackし、自動制作ジョブを止めません。

## Difyの担当

Difyは、思考整理と軽量な構成生成を担当します。

1. 30案探索
   - コピー
   - 訴求軸
   - トーン
   - layoutHint
   - risk
   - bestFor

2. 15案整理
   - 30案を代表性のある15案へ絞る
   - merged / rejected / selected_for_typography を付与する

3. 15 Typography Draft Layout JSON
   - 完成デザインではなく、文字組みと情報配置を確認するためのLayout JSONを生成する
   - SVG文字列はプラグイン側テンプレートで生成する

4. 5案選定
   - 15案から方向性が重ならない5案を選ぶ
   - 選定理由を残す

5. 診断
   - 1案の強み、懸念、最初に直す点を出す

6. 比較
   - 5案の役割、強み、懸念、向いている用途を整理する
   - Primary / Secondaryを決める
   - background briefを作る

## Geminiの担当

Geminiは、視覚品質を上げる工程を担当します。

1. 5案高品質SVG化
   - 5件のTypography Draft SVGとLayout JSONを、編集可能な800x450 SVGへ仕上げる

2. 背景3案生成
   - Primary案に対して背景方向を3案生成する
   - 文字やCTAは壊さない
   - テキストは編集可能なまま残す

## Figma出力

各API工程が完了したら、以下を順番にFigmaへ出します。

1. `project_header`
2. `ideas`
3. `typography_drafts`
4. `refined_svgs`
5. `compare`
6. `background_variations`
7. `final_candidate`

Figma側の描画関数は `src/plugin/figma/renderProcessBoard.ts` にあります。

## fallback

`src/providers/index.ts` で以下を確認します。

- Dify URL / API Key
- Gemini API Key
- providerConfig
- fallbackToDemo

API設定が空、またはAPI呼び出しが失敗した場合はDemo providerへ切り替えます。

## Typography Draftの安定化

15案ドラフトはDifyに完全自由なSVGを書かせず、`layoutType`、コピー、CTA、日時、優先順位をJSONで返してもらいます。

プラグイン側は `src/utils/typographyDraftSvg.ts` のテンプレートでSVG化します。これにより、Figma貼り付け時の崩れ、外部参照、`foreignObject` 混入、文字サイズの暴れを抑えます。
