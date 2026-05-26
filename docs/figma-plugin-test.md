# Figma Plugin Test Guide

## ローカルプラグインとして読み込む

1. `npm install`
2. `npm run build`
3. Figma Desktopを開く
4. `Plugins > Development > Import plugin from manifest...`
5. リポジトリ直下の `manifest.json` を選択
6. `Plugins > Development` から `AI Creative Assistant Foundation` を起動

## サンプルでテストする

1. 自動制作タブを開く
2. `サンプルから開始`
3. `自動制作を開始`
4. Production Timelineで進行状況を確認
5. Figmaキャンバスに以下が順番に出ることを確認
   - Project Header
   - 30 Ideas Explore
   - 15 Typography Drafts
   - 5 Refined SVGs
   - Compare Result
   - Background Variations
   - Final Candidate
6. 5案SVGが検討フェーズ下に横並びで配置されることを確認

## Live Modeをテストする

1. 設定タブを開く
2. Dify / GeminiのURLとKeyを入力
3. `接続設定を確認`
4. `設定を保存`
5. 自動制作タブで要件を入力
6. `自動制作を開始`
7. Demo Modeへfallbackした場合は、Production Timelineと処理ログで該当工程を確認

## 診断を確認する

1. Figmaキャンバス上で診断したい800x450フレームを1つ選択
2. 診断タブで `選択フレームを診断`
3. 診断サマリー、強い点、気になる点、最初に直すなら、派生案を確認
4. `診断ボードをFigmaに出力`

診断では1案だけを選択します。複数案を選ぶと、どの案の伝わり方を見るべきか曖昧になるためです。

## 比較を確認する

1. Figmaキャンバス上で比較したい2〜5案を選択
2. 比較タブで `選択中の案を比較`
3. 比較表、ベース候補、次点候補、background briefを確認
4. `比較ボードをFigmaに出力`

比較では複数案を選び、役割や強みの違いを見ます。

## 仕上げを確認する

1. 比較結果から仕上げタブへ進む
2. background briefを確認
3. 背景候補を生成
4. 背景をFigmaに適用
5. `仕上げボードをFigmaに出力`

## よくあるエラー

- フレームが選択されていません: Figmaキャンバス上で対象フレームをクリックしてください。
- 複数選択されています: 診断では1つだけ選択してください。
- Frame以外を選択しています: テキストや図形ではなく800x450のフレームを選んでください。
- API設定が未完了です: 設定タブでURL / Keyを保存してください。
- SVGが貼れません: SVG validationのエラー内容を確認してください。
- background対象フレームが見つかりません: 比較結果から仕上げへ進み直してください。
