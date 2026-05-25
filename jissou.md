# AI Cover Studio 実装整理

このファイルは、現在のFigmaプラグインがどのように実装されているかを、開発・検証・API連携の観点で整理したものです。

目的は、単に完成バナーを1枚出すことではなく、AIが検討した制作プロセスをFigma上に段階的に記録することです。

## 実装の全体像

現在の構成は大きく4層です。

1. UI層
   - `src/ui/`
   - React / TypeScriptでプラグインUIを表示します。
   - 探索、診断、比較、仕上げの画面を持ちます。

2. Workflow層
   - `src/workflows/`
   - UIから呼ばれる処理単位です。
   - `runExploreWorkflow`
   - `runGenerateSvgWorkflow`
   - `runDiagnoseWorkflow`
   - `runCompareWorkflow`
   - `runBackgroundWorkflow`

3. Provider層
   - `src/providers/`
   - demo / dify / gemini の切り替えを担当します。
   - API未設定、またはAPI失敗時はDemo Modeへfallbackします。

4. Figma描画層
   - `src/plugin/figma/`
   - Figma APIを使って、SVG配置、選択フレーム抽出、プロセスボード生成を行います。
   - UIコンポーネント側にはFigma APIを混ぜない方針です。

## 新しい制作フロー

探索フェーズは、以下の段階型フローとして扱います。

1. Project Header
2. 30 Ideas Explore
3. 15 Typography Drafts
4. 5 Refined SVGs
5. Diagnosis
6. Compare
7. Background Variations
8. Final Candidate

重要なのは、これらを「1つの巨大なFull Processフレーム」にまとめないことです。

実際にAPIを叩いて動かす場合は、各工程の完了ごとに出力が発生します。そのため、Figma上でも工程ごとの独立したフレームとして生成します。

## Figmaへの貼り付け順

`自動制作を開始` を押すと、UI側から `PLACE_EXPLORE_PACKAGE` が送られます。

受け取り側は `src/plugin/code.ts` です。

現在の貼り付け順は以下です。

1. `Project Header` を生成してFigmaに貼る
2. 少し待つ
3. `30 Ideas Explore` を生成してFigmaに貼る
4. 少し待つ
5. `15 Typography Drafts` を生成してFigmaに貼る
6. 少し待つ
7. `5 Refined SVGs` を生成してFigmaに貼る
8. 最後に実際の5案SVGを横並びで配置する

この処理は以下で実装しています。

- `src/plugin/code.ts`
  - `PLACE_EXPLORE_PACKAGE`
  - `renderProcessStageBoard(...)`
  - `placeProjectCandidates(...)`

段階的な見え方を作るため、各ボード生成の間に短い `sleep(...)` を入れています。

## 工程別ボード生成

工程別ボードは `src/plugin/figma/renderProcessBoard.ts` にあります。

主な関数は以下です。

- `renderProcessBoard(project)`
  - 全工程を一括で出すための互換関数です。
  - 現在は親フレームではなく、独立した複数フレームを横並びに作ります。

- `renderProcessStageBoard(project, stage)`
  - 1工程だけをFigmaに出す関数です。
  - 実API連携時は、この関数を工程完了ごとに呼ぶ想定です。

- `renderProcessStage(project, stage, x, y)`
  - stage名に応じて描画関数へ振り分けます。

対応するstageは以下です。

```ts
type ProcessBoardStage =
  | "project_header"
  | "ideas"
  | "typography_drafts"
  | "refined_svgs"
  | "diagnosis"
  | "compare"
  | "background_variations"
  | "final_candidate";
```

この型は `src/plugin/figma/messageBridge.ts` にあります。

## データ構造

プロジェクト全体は `ProjectData` で管理します。

主な定義:

- `src/schemas/project.ts`
- `src/schemas/workflow.ts`

段階型フロー用のデータは `StageWorkflowData` です。

```ts
type StageWorkflowData = {
  ideaDirections: IdeaDirection[];
  typographyDrafts: TypographyDraft[];
  refinedSvgCandidates: RefinedSvgCandidate[];
  demoComparison?: DemoComparison;
  backgroundVariations: BackgroundVariation[];
  finalCandidate?: FinalCandidate;
};
```

## Demo Mode

APIなしでも展示会デモができるように、Demo Modeを優先しています。

Demoデータは主に以下です。

- `src/data/demo/stagedWorkflowDemo.ts`
- `src/providers/demo/demoExplore.ts`
- `src/providers/demo/demoSvg.ts`
- `src/providers/demo/demoDiagnosis.ts`
- `src/providers/demo/demoCompare.ts`
- `src/providers/demo/demoBackground.ts`

Demo Modeでは以下を持ちます。

- 30件のコピー・訴求方向
- 15件のTypography Draft SVG
- 5件のRefined SVG
- Demo比較結果
- 背景3案
- 最終候補

## API fallback

Provider切り替えは `src/providers/index.ts` で行います。

たとえば比較は以下の流れです。

1. `providerConfig.compare` を見る
2. `dify` ならDify設定を確認
3. URLまたはAPI Keyが空ならdemoへfallback
4. API呼び出しがthrowした場合もdemoへfallback
5. `providerMeta.fallbackUsed` にfallback情報を入れる

関連ファイル:

- `src/config/providers.ts`
- `src/config/apiSettings.ts`
- `src/providers/index.ts`

## 比較の実装

比較は `Compare` 画面から行います。

UI:

- `src/ui/screens/CompareScreen.tsx`

Workflow:

- `src/workflows/compareWorkflow.ts`

Provider:

- `src/providers/index.ts`
- `src/providers/demo/demoCompare.ts`
- `src/providers/dify/compareClient.ts`

Figma選択フレームの取得:

- `src/plugin/figma/extractMultiFrameData.ts`

比較対象はFigma上で選択された2から5個程度のフレームです。

## Demo比較の考え方

Demo比較では、点数をUIの中心には出していません。

内部的には比較のために簡易スコアを使いますが、ユーザーには以下を見せます。

- 各案の役割
- 強み
- 懸念
- 向いている用途
- Primary候補
- Secondary候補
- 選定理由
- background brief

スコアリングは `src/providers/demo/demoCompare.ts` の `scoreFrame(...)` で行います。

主な評価観点:

- 800x450の固定サイズに合っているか
- 主見出しがあるか
- CTAらしい要素があるか
- 日時情報があるか
- 文字量が多すぎないか
- note用途の場合、広告感が強すぎないか
- ruleCheckでwarning/failが多くないか

セミナーバナーの場合は、特に以下を重視します。

- タイトル
- 日時
- CTA
- 参加メリット
- 情報量の整理

noteサムネイルの場合は、以下を重視します。

- 主題が残るか
- 文字量が多すぎないか
- 広告感が強すぎないか
- 読み物らしい余白があるか

## Primary / Secondaryの決め方

Demo比較では、選択されたフレームごとにrule checkを行い、内部スコアで並び替えます。

1位を `Primary`
2位を `Secondary`

として扱います。

ただし、UI上では「勝ち案」「正解」とは表現しません。

理由は、デザイン判断は絶対評価ではなく、用途、ターゲット、掲載面、運用目的によって変わるためです。

そのため表示文言は以下のようにしています。

- ベース候補
- 次点候補
- 選定理由
- 向いている用途
- 懸念

## background brief

比較が終わると、Primary候補に対してbackground briefを作ります。

Demoでは `buildBackgroundBrief(...)` で生成しています。

主な内容:

- 対象フレームID
- 対象フレーム名
- 背景のムード
- 背景スタイル
- 避けること
- 文字領域への配慮
- suggested style keywords
- promptText

仕上げフェーズでは、このbriefをもとに背景生成・適用を行います。

## 診断の実装

診断は1フレームのみを対象にします。

Figma側:

- `src/plugin/figma/extractFrameData.ts`

UI側:

- `src/ui/screens/DiagnoseScreen.tsx`

Provider:

- `src/providers/demo/demoDiagnosis.ts`
- `src/providers/dify/diagnosisClient.ts`

診断では点数中心にせず、以下の観点を出します。

- 診断概要
- 最初に伝わること
- 強い点
- 気になる点
- 最初に直すなら
- この指摘から作れる派生案

## SVG生成と配置

5案SVGは `SvgCandidate` として扱います。

Figma配置は以下です。

- `src/plugin/figma/createSvgNode.ts`
- `figma.createNodeFromSvg(svg)`

プロセスボード内のSVGプレビューは以下です。

- `appendSvg(...)`
- `createNodeFromSvg`
- `rescale(...)`
- preview frame内に中央配置

重要な方針:

- SVGは800x450固定
- text要素を使う
- Figma上で編集可能な構造を保つ
- external image / script / foreignObjectは避ける

## UI側の自動進行

探索画面では `ProductionStage` を持っています。

```ts
type ProductionStage =
  | "idle"
  | "input_ready"
  | "exploring_ideas"
  | "placing_ideas_board"
  | "generating_typography_drafts"
  | "placing_typography_board"
  | "selecting_refined_candidates"
  | "generating_refined_svgs"
  | "placing_refined_board"
  | "running_auto_compare"
  | "placing_compare_board"
  | "generating_backgrounds"
  | "placing_background_board"
  | "placing_final_candidate"
  | "completed"
  | "error";
```

UI上ではこのstageに応じて、ProductionTimelineとボタン文言を変えています。

主な処理:

- `runFullAutoProduction`
- `createProjectFromInput`
- `getProductionStageLabel`
- `getProductionStageMessage`

現在のUIは、ユーザーが複数ボタンを順番に押すよりも、主ボタン1つで最終候補まで進む体験を優先しています。

## 自動制作ジョブ

`runFullAutoProduction()` は、以下の順で処理します。

1. 入力確認
2. 30案探索
3. Project Header / 30 Ideas ExploreをFigmaへ記録
4. 15 Typography DraftsをFigmaへ記録
5. 5 Refined SVGsを生成
6. 5 Refined SVGs Boardと5案SVGをFigmaへ記録
7. 生成済み5案から仮想 `FigmaFrameData` を作り、自動比較
8. Compare BoardをFigmaへ記録
9. background briefから背景を生成
10. Background Variations BoardをFigmaへ記録
11. Final Candidate BoardをFigmaへ記録
12. completedへ遷移

手動の診断・比較・仕上げタブは、詳細確認や再実行用として残しています。

## 今後API連携する場合の想定

将来的にDify / Geminiを実APIで動かす場合は、以下のように分ける想定です。

### Dify

Difyは思考整理と軽量生成を担当します。

- 30案探索
- 30案から15案への整理
- 15案Typography Draft SVG生成
- 15案から5案を選ぶ理由生成
- 診断コメント生成
- 比較コメント生成

### Gemini

Geminiは視覚品質を上げる工程を担当します。

- 5案の高品質SVG化
- Primary案に対する背景3案生成

### Figma

Figmaは結果のレビュー・編集・記録の場です。

- A1完了後に `30 Ideas Explore` ボードを生成
- A2完了後に `15 Typography Drafts` ボードを生成
- A3完了後に `5 Refined SVGs` ボードと5案SVGを生成
- B完了後に `Diagnosis` ボードを生成
- C完了後に `Compare` ボードを生成
- D完了後に `Background Variations` / `Final Candidate` を生成

## 現在の確認方法

1. `npm run build`
2. Figma Desktopを開く
3. `manifest.json` をローカルプラグインとして読み込む
4. プラグインを起動
5. 探索画面で `自動制作を開始`
6. Figma上に以下の順でボードが増えることを確認
   - Project Header
   - 30 Ideas Explore
   - 15 Typography Drafts
   - 5 Refined SVGs
   - 5案SVG
7. 1案を選択して診断
8. 2から5案を選択して比較
9. Compare結果から仕上げへ進む
10. 背景生成・適用を確認

## 注意点

- 現在はDemo Modeの体験を優先しています。
- 比較は内部スコアを使いますが、UIでは点数を主役にしません。
- Figma上の出力は、最終成果物だけでなく検討過程を残すことを重視しています。
- `Full Process` という巨大な親フレームに全工程を閉じ込める設計は避けています。
- 実API化する場合も、工程ごとにFigmaへ記録ボードを出す方針です。
