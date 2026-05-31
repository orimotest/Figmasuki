# API Settings

API設定は、プラグイン内の設定ドロワー、または `src/config/apiSettings.ts` で管理します。

## 推奨: 設定ドロワーで保存する

1. プラグインを起動
2. ヘッダー右側の設定アイコンを押す
3. Dify Workflow URL / API Keyを入力
4. Gemini API Key / modelを入力
5. `接続設定を確認`
6. `設定を保存`

保存先はFigma `clientStorage` です。API KeyはUIではマスク表示され、ログには出しません。

## ファイルで設定する

```bash
cp src/config/apiSettings.example.ts src/config/apiSettings.ts
```

Windows PowerShell:

```powershell
Copy-Item src\config\apiSettings.example.ts src\config\apiSettings.ts
```

`apiSettings.ts` へURL / Keyを入れます。実キーはGitへコミットしないでください。

## 設定の優先順位

1. Figma `clientStorage`
2. `src/config/apiSettings.ts`
3. `src/config/apiSettings.example.ts` はサンプルのみ

## Dify設定項目

- `inputOrganizer`
- `ideaExplorer`
- `typographyPlanner`
- `candidateSelector`
- `diagnosis`
- `compare`

各項目に `url` と `apiKey` を設定します。

## Gemini設定項目

- `apiKey`
- `textModel`
- `svgModel`
- `imageModel`

## providerConfigとの関係

`src/config/providers.ts` は、どのproviderを使うかを決めます。  
`apiSettings.ts` と設定ドロワーは、Dify / GeminiのURLやKeyを管理します。

設定ドロワーの制作モードで `Demo` を選ぶと、接続情報が保存されていても外部APIは呼びません。`API` を選び、DifyまたはGeminiの設定が入っている場合だけAPI接続を使います。API設定が未完了、またはAPI呼び出しに失敗した場合は代替処理で継続できるようにしています。
