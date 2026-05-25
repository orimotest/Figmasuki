# Live Provider Setup

live providerを使う場合は、API設定とprovider切り替えを分けて考えます。

## API設定

`src/config/apiSettings.example.ts` を `src/config/apiSettings.ts` にコピーし、Dify / GeminiのURLとkeyを入れます。

`src/config/apiSettings.ts` は `.gitignore` 対象です。実キーはコミットしないでください。

## provider切り替え

`src/config/providers.ts` を編集します。

```ts
export const providerConfig = {
  copy: "demo",
  layout: "demo",
  svg: "demo",
  diagnosis: "demo",
  compare: "demo",
  background: "demo",
  fallbackToDemo: true,
};
```

Difyを使う場合:

- `copy`: `"dify"`
- `layout`: `"dify"`
- `diagnosis`: `"dify"`
- `compare`: `"dify"`

Geminiを使う場合:

- `svg`: `"gemini"`
- `background`: `"gemini"`

`fallbackToDemo: true` の場合、live providerが失敗してもdemo結果に戻ります。
