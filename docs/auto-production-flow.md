# 自動制作フロー

AI Cover Studioの主体験は、タブを手動で渡り歩く操作ではなく、1つの制作ジョブが最終候補まで進む流れです。

## ユーザー体験

1. 要件を入力する
2. `自動制作を開始` を押す
3. Production Timelineで現在工程を見る
4. Figma上に工程別ボードが順番に増える
5. 5案比較、背景3案、Final Candidateまで自動で進む

診断、比較、仕上げタブは、詳細確認や部分的な再実行用として残しています。

## ProductionStage

現在の自動制作は以下のstageを持ちます。

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

## Figma出力順

1. `01 Project Header`
2. `02 30 Ideas Explore`
3. `03 15 Typography Drafts`
4. `04 5 Refined SVGs`
5. 5案SVG
6. `05 Compare Result`
7. `06 Background Variations`
8. `07 Final Candidate`

各工程は `renderProcessStageBoard(project, stage)` で個別にFigmaへ出力します。

## 自動比較

自動制作では、ユーザーにFigma上で5案を選択させません。

生成された5件の `SvgCandidate` と、対応するコピー方向性、layoutType、CTA、日時情報を使って、比較用の仮想 `FigmaFrameData` を作ります。

その仮想フレームを `runCompareWorkflow` に渡し、既存のDemo比較ロジックを使ってPrimary / Secondaryを決めます。

## 自動背景生成

比較結果の `backgroundBrief` を `runFinishWorkflow` に渡します。

Demo Modeでは `demoGenerateBackground` にfallbackし、Primary案に対する背景方向を生成します。

背景の実画像生成や編集可能レイヤーの高度化は、Gemini連携時に差し替える想定です。

## Demo Mode

API未設定でも停止せず、Demo Modeで以下まで進みます。

- 30案探索
- 15 Typography Drafts
- 5 Refined SVGs
- 自動比較
- 背景3案
- Final Candidate

