# Troubleshooting

## Figmaに読み込めない

- `npm run build` が成功しているか確認
- `manifest.json` の `main` と `ui` のパスを確認
- FigmaのDevelopment Pluginを再読み込み

## manifestのパスが違う

`manifest.json` はリポジトリ直下にあります。Figmaで読み込む時はこのファイルを選択してください。

## npm run buildで失敗

```bash
npm run typecheck
npm run build
```

エラー行を確認し、TypeScriptの型エラーから直してください。

## figma is not defined

ブラウザでFigma API操作を実行しています。SVG配置、診断、比較、背景適用、ボード生成はFigma Plugin内でのみ動きます。

## プラグイン画面が真っ白

Figma DesktopがUI用のJS/CSSを読めていない可能性があります。

このプロジェクトは `npm run build` 時に `dist/index.html` へUIのJS/CSSをインライン化します。

対処:

```bash
npm run build
```

その後、Figmaで `manifest.json` を読み込み直してください。

```text
Plugins > Development > Import plugin from manifest...
```

読み込むファイル:

```text
FigmaPJ/manifest.json
```

## SVGが貼れない

- SVG validationがOKか確認
- Figma Pluginを再起動
- `npm run build` 後の `dist/code.js` が更新されているか確認

## APIが動かない

- `src/config/apiSettings.ts` にURLとkeyが入っているか確認
- `src/config/providers.ts` が `demo` のままではないか確認
- Dify workflowの出力JSONが期待構造に合っているか確認

## demo fallbackになっている

live providerが失敗した場合、`fallbackToDemo: true` ならdemo結果を表示します。原因はログのfallbackReasonを確認してください。
