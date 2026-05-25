# Setup

## インストール

```bash
npm install
```

## 開発UI

```bash
npm run dev
```

`http://127.0.0.1:5173` でReact UIを確認できます。ただしFigma APIを使う操作はFigma内でのみ動きます。

## ビルド

```bash
npm run build
```

`dist/` にUIとplugin codeが出力されます。

## Figmaで読み込む

1. Figmaを開く
2. Plugins > Development > Import plugin from manifest...
3. `manifest.json` を選択
4. Development pluginとして起動

起動できない場合は `npm run build` の成功と `manifest.json` のパスを確認してください。
