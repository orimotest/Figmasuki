# Figma Plugin Test Guide

## ローカルプラグインとして読み込む

1. `npm install`
2. `npm run build`
3. Figma Desktopを開く
4. Plugins > Development > Import plugin from manifest...
5. リポジトリ直下の `manifest.json` を選択
6. Plugins > Development から `AI Creative Assistant Foundation` を起動

## APIなしでテストする

1. 探索画面で「Demoサンプルを読み込む」
2. コピー方向性5件とSVG候補5件が表示されることを確認
3. 「5案をまとめてFigmaに配置」を押す
4. Figma上に5つの800x450フレームが横並びで配置されることを確認
5. 「プロセスボードをFigmaに作成」を押す
6. Project Header、Copy Direction、Layout Strategy、SVG Candidateの各ボードが出ることを確認

## 診断を確認する

1. Figmaキャンバス上で診断したいバナー案を1つだけ選択
2. 診断画面で「選択中のフレームを診断」
3. 診断概要、最初に伝わること、強い点、気になる点が表示されることを確認
4. 「診断結果をFigmaに記録」を押す
5. Diagnosis BoardがFigma上に追加されることを確認

診断では1案だけ選択します。複数選択していると、どの案の伝わり方を見るべきか曖昧になるためです。

## 比較を確認する

1. Figmaキャンバス上で比較したいバナー案を2〜5個選択
2. 比較画面で「選択中の案を比較」
3. 比較表、ベース候補、次点候補、background briefが表示されることを確認
4. 「比較結果をFigmaに記録」を押す
5. Compare BoardがFigma上に追加されることを確認

比較では複数案を選択します。役割や強みの違いを見て、仕上げるベース案を選ぶためです。

## 仕上げを確認する

1. 比較結果のbackground briefを仕上げ画面へ送る
2. 仕上げ画面で背景スタイルを選ぶ
3. 「Demo背景を生成」を押す
4. 「背景をFigmaに適用」を押す
5. 対象フレームに背景レイヤーが追加され、テキストやCTAが残っていることを確認
6. 「仕上げ結果をFigmaに記録」を押す

## よくあるエラー

- フレームが選択されていません: Figmaキャンバス上で対象フレームをクリックしてください。
- 複数選択されています: 診断では1つだけ選択してください。
- Frame以外を選択しています: テキストや図形ではなく、800x450のフレームを選択してください。
- APIが未設定です: Demo Modeでfallbackします。テストは継続できます。
- background対象フレームが見つかりません: 比較結果から仕上げへ進み直してください。
