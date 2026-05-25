# API Settings

API設定は `src/config/apiSettings.ts` に集約します。

## 作成方法

```bash
cp src/config/apiSettings.example.ts src/config/apiSettings.ts
```

Windows PowerShell:

```powershell
Copy-Item src\config\apiSettings.example.ts src\config\apiSettings.ts
```

## 設定する値

- `dify.copy.url`
- `dify.copy.apiKey`
- `dify.layout.url`
- `dify.layout.apiKey`
- `dify.ideas.url`
- `dify.ideas.apiKey`
- `dify.draftSelection.url`
- `dify.draftSelection.apiKey`
- `dify.typographyDraft.url`
- `dify.typographyDraft.apiKey`
- `dify.refinedSelection.url`
- `dify.refinedSelection.apiKey`
- `dify.diagnosis.url`
- `dify.diagnosis.apiKey`
- `dify.compare.url`
- `dify.compare.apiKey`
- `gemini.apiKey`
- `gemini.textModel`
- `gemini.imageModel`

段階型Live APIへ拡張する場合は、以下のDify workflowを用意します。

- 30案探索
- 15案整理
- Typography Draft Layout JSON生成
- 5案選定
- 診断コメント生成
- 比較コメント生成

現在のMVP実装では、既存互換の `copy` / `layout` / `diagnosis` / `compare` 入口を使い、段階型Live APIでは `ideas` / `draftSelection` / `typographyDraft` / `refinedSelection` を接続できる形にしています。API未設定または失敗時はDemo Modeへfallbackします。15案ドラフトSVGは、Difyが返すLayout JSONをプラグイン側テンプレートでSVG化する方針です。

## provider切り替え

`src/config/providers.ts` で `demo` / `dify` / `gemini` を切り替えます。

`apiSettings.ts` はAPIのURLとkey、`providers.ts` はどのproviderを使うか、という責務です。

`providers.ts` を `demo` のままにするとAPIは呼びません。Live APIを試す時だけ、必要なproviderを `dify` / `gemini` に切り替えます。

## 注意

`src/config/apiSettings.ts` は `.gitignore` 対象です。実キーはコミットしないでください。
