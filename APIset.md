# APIset

このファイルは、AI Cover StudioをLive Modeで動かすためのAPI設定メモです。

## 全体像

Figma Plugin:
- 入力UI
- 入力正規化
- Typography Draft SVGテンプレート生成
- SVG validation
- Figmaへの工程ボード配置

Dify:
- 入力整理
- 30案探索
- 15案Layout Draft JSON
- 5案選定
- 診断
- 比較

Gemini:
- 5案の高品質SVG化
- Primary案の背景3案生成

## 設定方法

### 1. Settings画面で設定する

プラグインの「設定」タブで、Dify Workflow URL / API Key、Gemini API Key / modelを入力し、「接続設定を確認」してから「設定を保存」を押します。

保存先はFigma `clientStorage` です。API KeyはUI上ではマスク表示し、ログには出しません。

保存後、UI側の一時設定にも同期されます。DifyまたはGeminiの有効な設定が1つ以上ある場合、通常画面の実行モードは `Live` と表示されます。未設定の場合は `Demo` と表示され、サンプル制作フローで進行します。

### 2. apiSettings.tsで設定する

`src/config/apiSettings.example.ts` を参考に `src/config/apiSettings.ts` へ入力します。

```ts
export const apiSettings = {
  dify: {
    inputOrganizer: { url: "", apiKey: "" },
    ideaExplorer: { url: "", apiKey: "" },
    typographyPlanner: { url: "", apiKey: "" },
    candidateSelector: { url: "", apiKey: "" },
    diagnosis: { url: "", apiKey: "" },
    compare: { url: "", apiKey: "" },
  },
  gemini: {
    apiKey: "",
    textModel: "gemini-1.5-flash",
    imageModel: "gemini-1.5-flash",
    svgModel: "gemini-1.5-flash",
  },
};
```

実キーはGitに入れないでください。

## 設定の優先順位

1. Figma `clientStorage`
2. `src/config/apiSettings.ts`
3. `src/config/apiSettings.example.ts` はサンプルのみ

## 必要なDify Workflow

1. Input Organizer
2. Idea Explorer
3. Typography Planner
4. Candidate Selector
5. Diagnosis
6. Compare

## Dify Workflow仕様

詳しいJSON例とSystem Promptは [docs/dify-workflows.md](docs/dify-workflows.md) を参照してください。

重要な方針:

- Typography PlannerはSVGではなくLayout Draft JSONを返す
- Plugin側がテンプレートから15案Typography Draft SVGを生成する
- Candidate Selectorは似ていない5案を選ぶ
- CompareはPrimary / Secondary / backgroundBriefを返す

## Gemini仕様

詳しいPromptは [gemini.md](gemini.md) を参照してください。

Geminiには5案だけを渡します。30案や15案すべてを渡しません。

## API Keyを入れた後の確認手順

1. プラグインを起動
2. 設定タブでURL / Keyを入力
3. 「接続設定を確認」
4. 「設定を保存」
5. 自動制作タブで要件を入力
6. 「自動制作を開始」
7. Figmaに各工程ボードが順番に出ることを確認
8. Compare Board、Background Variations Board、Final Candidate Boardまで確認

## よくあるエラー

### API Key未設定

設定タブで該当WorkflowのURL / Keyを確認してください。

### URL間違い

Dify Workflow URLは `/v1/workflows/run` のエンドポイントを使います。

### JSON parse失敗

DifyがMarkdownや説明文を返している可能性があります。Workflowの出力をJSONのみへ制限してください。Plugin側はコードフェンス付きJSONの抽出にも対応しています。

### SVGが壊れる

Gemini SVGは必ず以下を守ります。

- `viewBox="0 0 800 450"`
- `text` 要素あり
- `foreignObject` なし
- `script` なし
- external image URLなし

### Figmaに貼れない

SVG validationエラーを確認してください。失敗したSVGは該当案だけfallbackし、他の案は継続できる設計にします。
