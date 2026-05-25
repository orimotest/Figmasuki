# AI Creative Assistant Figma Plugin

AIが考えたコピー方向性、レイアウト方針、SVG候補、診断、比較、仕上げ方針を、Figma上にプロセスボードとして残すための制作支援プラグインです。完成バナーだけではなく、判断材料ごとレビューできる状態を目指しています。

## A/B/C/D

- A / 探索: 要件または確定コピーから30案を探索し、5方向のコピーとSVG候補に整理します。
- B / 診断: Figma上で選択した1案を読み取り、強い点、気になる点、最初に直す点を整理します。
- C / 比較: 2〜5案を比較し、ベース候補、次点候補、background briefを作ります。
- D / 仕上げ: 選ばれた案だけに背景を生成・適用し、最終案として確認します。

## Setup

```bash
npm install
npm run dev
npm run build
```

Figmaで使う場合:

1. `npm run build`
2. Figma Desktopを開く
3. Plugins > Development > Import plugin from manifest...
4. このリポジトリの `manifest.json` を選択
5. Plugins > Development からプラグインを起動

## APIなしでDemoフローを確認する

展示会デモや初回確認では、API keyを入れなくても最後まで動きます。

1. `npm run build`
2. Figmaで `manifest.json` を読み込む
3. プラグインを起動
4. 探索画面で「Demoサンプルを読み込む」
5. 「5案をまとめてFigmaに配置」
6. 「プロセスボードをFigmaに作成」
7. Figmaキャンバス上で1案を選択
8. 診断画面で「選択中のフレームを診断」
9. 「診断結果をFigmaに記録」
10. Figmaキャンバス上で2〜5案を選択
11. 比較画面で「選択中の案を比較」
12. 「比較結果をFigmaに記録」
13. 仕上げ画面で「Demo背景を生成」「背景をFigmaに適用」
14. 「仕上げ結果をFigmaに記録」

## Figmaにプロセスを記録する

探索結果は、次のボードとしてFigmaキャンバスに記録できます。

- Project Header Board
- Copy Direction Board
- Layout Strategy Board
- SVG Candidate Board
- Diagnosis Board
- Compare Board
- Finish Board

探索段階でも、Project Header、コピー方向性、レイアウト方針、SVG候補は出力されます。診断、比較、仕上げを実行したあとに、それぞれの結果もFigma上へ追加できます。

## Webローカルで確認できる範囲

- React UIの表示
- Demoデータ
- SVG preview
- 入力フォームやタブ移動

## Figma内でしか確認できない範囲

- SVGをFigmaに配置
- 選択フレーム診断
- 複数フレーム比較
- 背景適用
- プロセスボード生成

## API設定

APIを使う場合は、`src/config/apiSettings.example.ts` をコピーして `src/config/apiSettings.ts` を作ります。

```bash
cp src/config/apiSettings.example.ts src/config/apiSettings.ts
```

`apiSettings.ts` にDify / GeminiのURLとAPI keyを入れてください。実キーはコミットしないでください。providerの切り替えは `src/config/providers.ts` で行います。

APIが未設定、またはAPI呼び出しに失敗した場合はDemo Modeへfallbackします。

## よくあるエラー

- `figma is not defined`: ブラウザ単体ではFigma APIを使えません。Figma Desktop上で確認してください。
- APIが動かない: `apiSettings.ts` と `providers.ts` を確認してください。未設定でもDemo Modeで動きます。
- SVGが貼れない: `npm run build` 後にFigma側でプラグインを再起動してください。
- 何も表示されない: `manifest.json` がこのリポジトリ直下のものか確認し、`dist/code.js` と `dist/ui.html` が生成されているか確認してください。

詳しくは `docs/` を参照してください。
