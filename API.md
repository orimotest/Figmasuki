# API連携手順

このFigmaプラグインは、demoとAPIを分けて動かします。
API設定が空のときはdemo、DifyまたはGeminiの設定が入っているとAPIモードになります。

## 共有リンク

- GitHub: https://github.com/orimotest/Figmasuki
- 作業ブランチ: `codex/design-quality-pass`
- Dify側のプロンプト: [Dify.md](Dify.md)
- 提出サマリー: [teisyutu.md](teisyutu.md)

## 最初に見るファイル

1. `src/config/apiSettings.ts`
2. `src/config/apiSettings.example.ts`
3. `src/config/runtimeApiSettings.ts`
4. `src/providers/dify/*Client.ts`
5. `src/providers/gemini/*`

APIキーは設定タブやlocalStorageには保存しません。
API担当者は `src/config/apiSettings.ts` にURLとキーを入れて、ローカルでbuildしてください。

## apiSettings.ts の書き方

```ts
export const apiSettings = {
  dify: {
    inputOrganizer: { url: "https://api.dify.ai/v1/workflows/run", apiKey: "DifyのWorkflow API Key" },
    ideaExplorer: { url: "https://api.dify.ai/v1/workflows/run", apiKey: "DifyのWorkflow API Key" },
    typographyPlanner: { url: "https://api.dify.ai/v1/workflows/run", apiKey: "DifyのWorkflow API Key" },
    candidateSelector: { url: "https://api.dify.ai/v1/workflows/run", apiKey: "DifyのWorkflow API Key" },
    diagnosis: { url: "https://api.dify.ai/v1/workflows/run", apiKey: "DifyのWorkflow API Key" },
    compare: { url: "https://api.dify.ai/v1/workflows/run", apiKey: "DifyのWorkflow API Key" }
  },
  gemini: {
    apiKey: "Gemini API Key",
    textModel: "gemini-2.0-flash",
    imageModel: "gemini-2.0-flash",
    svgModel: "gemini-2.0-flash"
  }
};
```

`apiSettings.ts` は空欄のひな形だけGitHubに置いています。
本物のキーを入れたファイルはGitHubに上げないでください。
公開配布する場合は、Figmaプラグイン内にキーを入れず、サーバー側Proxyでキーを保護してください。

## Dify Workflowの役割

| 設定キー | 役割 | 返すもの |
| --- | --- | --- |
| `inputOrganizer` | 入力要件を制作ブリーフに整理 | `NormalizedCreativeInput` |
| `ideaExplorer` | 方向性を5案以上作る | `directions` |
| `typographyPlanner` | 15案の文字組みを作る | `drafts` |
| `candidateSelector` | 15案から5案を選ぶ | `selected` |
| `diagnosis` | 選択フレームを診断 | `DiagnosisResult` |
| `compare` | 5案比較と背景指示を作る | `ComparisonResult` |

## 実行フロー

1. ユーザーが要件入力またはMarkdownを入れる
2. `inputOrganizer` が制作ブリーフへ整理する
3. Requirement Document BoardをFigmaに出力する
4. `ideaExplorer` が方向性を作る
5. `typographyPlanner` が15案の文字組みJSONを作る
6. プラグイン側で15案プレビューSVGを作り、Figmaに出力する
7. `candidateSelector` が5案を選ぶ
8. 選ばれた5案をGeminiへ送り、編集可能SVGを生成する
9. 5案SVGをFigmaに出力する
10. `compare` がPrimary/Secondaryと背景指示を返す
11. Geminiが背景を生成する
12. Final Candidateは背景画像レイヤー、可読性レイヤー、編集可能SVGレイヤーに分けてFigmaへ出力する

APIモードでは失敗時にdemoへ自動で逃げません。エラーとして止めます。
Geminiだけで一括生成する場合は、実行前に確認ポップアップを出します。

## 動作確認コマンド

```powershell
npm.cmd install
npm.cmd run typecheck
npm.cmd run build
```

Figmaでは `manifest.json` を読み込みます。
Figma Desktopの `Plugins > Development > Import plugin from manifest...` から、このリポジトリ直下の `manifest.json` を選択してください。

## 重要なチェック

- APIキー入力欄はUIにありません
- `clientStorage` / `localStorage` にAPIキーを保存しません
- API設定が空ならdemo、設定が入ればAPIとして動きます
- Difyの返却JSONが不足するとAPIモードではエラーで止まります
- Gemini SVGは `800x450`、`viewBox="0 0 800 450"`、編集可能なSVG textを前提に検証します
- Final Candidateは背景と文字を1枚画像に潰さず、Figmaで後から調整できる構造で出力します
