# Development API Key Guide

このプロジェクトでは、API keyやWorkflow URLは `src/config/apiSettings.ts` にだけ入れます。

## 1. 最初にコピーするファイル

```powershell
Copy-Item src\config\apiSettings.example.ts src\config\apiSettings.ts
```

macOS / Linux:

```bash
cp src/config/apiSettings.example.ts src/config/apiSettings.ts
```

## 2. API keyを入れる場所

`src/config/apiSettings.ts` を開き、以下を設定します。

```ts
export const apiSettings = {
  dify: {
    copy: {
      url: "Dify Copy Workflow URL",
      apiKey: "Dify Copy API Key",
    },
    layout: {
      url: "Dify Layout Workflow URL",
      apiKey: "Dify Layout API Key",
    },
    diagnosis: {
      url: "Dify Diagnosis Workflow URL",
      apiKey: "Dify Diagnosis API Key",
    },
    compare: {
      url: "Dify Compare Workflow URL",
      apiKey: "Dify Compare API Key",
    },
  },
  gemini: {
    apiKey: "Gemini API Key",
    textModel: "gemini-2.0-flash",
    imageModel: "gemini-2.0-flash",
  },
};
```

## 3. providerを切り替える場所

API keyを入れただけではlive providerには切り替わりません。

`src/config/providers.ts` で使うproviderを切り替えます。

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

Difyを使う場合は、必要な箇所を `"dify"` に変更します。

Geminiを使う場合は、`svg` または `background` を `"gemini"` に変更します。

## 4. Gitに入れてはいけないもの

以下はGitにコミットしません。

- `src/config/apiSettings.ts`
- 実際のAPI key
- 実際のBearer token
- 個人やチームの非公開Workflow URL

`.gitignore` で `src/config/apiSettings.ts` は除外しています。

Gitに入れるのは `src/config/apiSettings.example.ts` だけです。

## 5. demo modeのまま使う場合

API keyを入れなくても、初期状態のdemo modeで以下を確認できます。

- 探索
- SVG候補生成
- Figma配置
- 診断
- 比較
- 仕上げ
- プロセスボード出力

ローカルデモやUI確認では、まずdemo modeを使うのがおすすめです。

## 6. よくある確認ポイント

- API keyを入れたのにdemoになる: `src/config/providers.ts` が `demo` のままです。
- Difyが失敗してdemoになる: `fallbackToDemo: true` のため、失敗時にdemo結果へ戻っています。
- buildで `apiSettings.ts` がないと言われる: `apiSettings.example.ts` をコピーしてください。
- GitHubにAPI keyが上がりそう: `git status --ignored` で `src/config/apiSettings.ts` が `!!` または表示されないことを確認してください。
