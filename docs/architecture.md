# Architecture

## UI

React / TypeScriptで、A/B/C/Dのタブを維持しています。

- `src/ui/screens/ExploreScreen.tsx`
- `src/ui/screens/DiagnoseScreen.tsx`
- `src/ui/screens/CompareScreen.tsx`
- `src/ui/screens/FinishScreen.tsx`

共通UIは `src/ui/components/` に置きます。

## Workflow

UIはworkflowを呼び、workflowはproviderを呼びます。

- `workflows/exploreWorkflow.ts`
- `workflows/diagnoseWorkflow.ts`
- `workflows/compareWorkflow.ts`
- `workflows/finishWorkflow.ts`

## Provider

`src/config/providers.ts` で provider mode を決めます。

- copy / layout / diagnosis / compare: `demo` or `dify`
- svg / background: `demo` or `gemini`

APIキーやURLは `src/config/apiSettings.ts` に集約します。

## Figma描画

Figma API操作は `src/plugin/figma/` に閉じ込めます。UIコンポーネントからFigmaノードを直接作りません。

プロセスボードは `renderProcessBoard.ts` が責務ごとに分けた関数で描画します。
