# Troubleshooting

Figmaプラグインをローカルで確認するときによく起きる問題と対処です。

## Figmaに読み込めない

- `npm run build` が成功しているか確認する
- `manifest.json` がプロジェクト直下にあるか確認する
- Figma Desktopで `Plugins > Development > Import plugin from manifest...` から読み込む
- 読み込むファイルは `FigmaPJ/manifest.json`

## プラグイン画面が真っ白

UI用のJS/CSSがFigma Desktop内で読み込めていない可能性があります。

対処:

```bash
npm run build
```

その後、Figma Desktopを再起動し、`manifest.json` を再インポートしてください。

このプロジェクトでは、`npm run build` 時にUI用のJS/CSSを `dist/index.html` に埋め込みます。

## プラグインUIの文字が文字化けする

古い `dist/index.html` が読み込まれているか、Figma側に開発プラグインのキャッシュが残っている可能性があります。

対処:

```bash
npm run build
```

その後、Figma Desktopを再起動し、`manifest.json` を再インポートしてください。

現在のビルドでは、Figma内で文字コードが崩れないように、UI用のJS/CSSをbase64化して `dist/index.html` に埋め込んでいます。

## 画面が狭くて操作しづらい

プラグインUIの初期サイズは `src/config/app.ts` で管理しています。

```ts
uiWidth: 960,
uiHeight: 720,
```

MacBookでのデモ確認を想定し、現在は横幅を広めにしています。変更した場合は `npm run build` を実行してください。

## manifestのパスが違う

Figmaで読み込むのはプロジェクト直下の `manifest.json` です。

```text
C:\Users\orimo\OneDrive\ドキュメント\FigmaPJ\manifest.json
```

`dist/index.html` や `dist/code.js` を直接読み込むのではありません。

## npm run buildで失敗する

まず型チェックを確認します。

```bash
npm run typecheck
npm run build
```

TypeScriptエラーが出ている場合は、最初のエラーから順に直してください。

## figma is not defined

ブラウザでFigma API操作を実行している可能性があります。

SVG配置、診断、比較、背景適用、プロセスボード生成はFigma Plugin内でのみ動きます。

## SVGが貼れない

- SVG validationがOKか確認する
- `foreignObject` や外部画像URLを含めない
- `npm run build` 後に `dist/code.js` が更新されているか確認する
- Figma Desktopで開発プラグインを再起動する

## APIが動かない

- `src/config/apiSettings.ts` にURLとAPI keyが入っているか確認する
- `src/config/providers.ts` が `demo` のままではないか確認する
- Dify workflowの出力JSONが期待構造に合っているか確認する

## demo fallbackになっている

live providerが失敗した場合、`fallbackToDemo: true` ならdemo結果を表示します。

原因はUIログやproviderのfallbackReasonを確認してください。
