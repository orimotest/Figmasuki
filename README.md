# AI Creative Assistant Figma Plugin

Figma上で、AIが考えたコピー、レイアウト、診断、比較、仕上げのプロセスを見ながら判断するための制作支援プラグインです。

完成バナーだけを置くのではなく、入力要件、コピー方向性、レイアウト方針、SVG候補、診断結果、比較結果、background brief、最終案をFigma上のプロセスボードとして残します。

## A/B/C/D

- A / 探索: 要件または確定コピーから30案を探索し、5方向へ整理してSVG候補を作ります。
- B / 診断: Figma上の選択フレーム1案を読み取り、伝わり方と最初に直す点を整理します。
- C / 比較: 2から5案を比較し、ベース候補、次点候補、background briefを作ります。
- D / 仕上げ: 選ばれた案だけに背景を生成し、編集可能なテキストを残したまま適用します。

## Setup

```bash
npm install
npm run dev
npm run build
```

Figmaでは `manifest.json` を読み込みます。

1. Figmaを開く
2. Plugins > Development > Import plugin from manifest...
3. このリポジトリの `manifest.json` を選択
4. `npm run build` 後、プラグインを起動

## ローカルで見られる範囲

`npm run dev` で `http://127.0.0.1:5173` を開くと、React UIの表示、入力、demo modeの探索表示を確認できます。

Figma内でしか確認できない範囲は、SVG配置、選択フレーム診断、複数フレーム比較、背景適用、プロセスボード生成です。

## API設定

`src/config/apiSettings.example.ts` をコピーして `src/config/apiSettings.ts` を作り、Dify / GeminiのURLとAPI keyを入れます。

`src/config/apiSettings.ts` は `.gitignore` 対象です。実キーはコミットしないでください。

providerの切り替えは `src/config/providers.ts` で行います。

開発者向けの詳しいAPI key設定手順は `docs/development-api-keys.md` を参照してください。

## demo mode

初期状態はすべて `demo` providerです。APIキーなしで、noteサンプル、セミナーサンプル、探索、診断、比較、仕上げの流れを確認できます。

## よくあるエラー

- `figma is not defined`: Figma Plugin外のブラウザでFigma APIを使う操作を押しています。Figma上で確認してください。
- APIが動かない: `apiSettings.ts` のURLとkey、`providers.ts` の切り替えを確認してください。
- SVGが貼れない: `npm run build` 後にFigma側でプラグインを再起動してください。

詳しくは `docs/` を参照してください。
