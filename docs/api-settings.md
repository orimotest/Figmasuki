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
- `dify.diagnosis.url`
- `dify.diagnosis.apiKey`
- `dify.compare.url`
- `dify.compare.apiKey`
- `gemini.apiKey`
- `gemini.textModel`
- `gemini.imageModel`

## provider切り替え

`src/config/providers.ts` で `demo` / `dify` / `gemini` を切り替えます。

`apiSettings.ts` はAPIのURLとkey、`providers.ts` はどのproviderを使うか、という責務です。

## 注意

`src/config/apiSettings.ts` は `.gitignore` 対象です。実キーはコミットしないでください。
