# AI Cover Studio Figma Plugin

AI Cover Studioは、完成バナーを1枚だけ作るためのツールではありません。  
AIが探索したコピー、文字組み、SVG案、比較、背景仕上げの過程をFigma上に記録し、デザイナーが判断できるようにするFigmaプラグインです。

## 新しい制作フロー

1. A1 / 30案探索  
   Dify想定でコピー、訴求軸、トーン、レイアウト方向を30案広げます。

2. A2 / 15案文字組みドラフト  
   30案を整理し、15案のTypography Draft SVGを作ります。完成デザインではなく、文字サイズ、余白、CTA位置、日時情報の見え方を確認します。Live APIではDifyに自由なSVGを作らせず、Layout Draft JSONを返してもらい、プラグイン側テンプレートで安定したSVGにします。

3. A3 / 5案高品質SVG  
   15案から5案に絞り、Gemini想定で編集可能な高品質SVGへ仕上げます。

4. B / 診断  
   Figma上で1案を選び、強み、懸念、最初に直す点を記録します。

5. C / 比較  
   2から5案を比較し、Primary / Secondary候補と選定理由を記録します。

6. D / 背景仕上げ  
   Primary案に対して背景3案を作り、選ばれた背景を適用します。テキストとCTAは編集可能なまま残します。

## セットアップ

```bash
npm install
npm run dev
npm run build
```

Figma Desktopで使う場合:

1. `npm run build`
2. Figma Desktopを開く
3. `Plugins > Development > Import plugin from manifest...`
4. このリポジトリ直下の `manifest.json` を選ぶ
5. `Plugins > Development` からプラグインを起動する

## APIなしでDemoフローを確認する

APIキーがなくてもDemo Modeで一連の流れを確認できます。

1. `npm run build`
2. Figmaで `manifest.json` を読み込む
3. プラグインを起動
4. 探索画面で `自動制作を開始`
5. UI上のProduction Timelineで進行状況を確認
6. Figmaキャンバス上に工程ごとのボードが順番に配置される
7. 5案の自動比較、背景3案、Final CandidateまでDemo Modeで進む
8. 必要に応じて、診断・比較・仕上げタブで詳細確認や再実行を行う

## 自動制作ジョブ

メイン体験は、ユーザーがタブを渡り歩く操作ではなく、1つの制作ジョブが最終候補まで進む流れです。

`自動制作を開始` を押すと、以下が順番に進みます。

1. 要件を確認
2. 30案を探索
3. 30 Ideas Explore BoardをFigmaに記録
4. 15案のTypography Draftを生成
5. 15 Typography Drafts BoardをFigmaに記録
6. 5案を高品質SVG化
7. 5 Refined SVGs Boardと5案SVGをFigmaに記録
8. 5案を自動比較
9. Compare BoardをFigmaに記録
10. Primary案の背景3案を生成
11. Background Variations BoardをFigmaに記録
12. Final Candidate BoardをFigmaに記録

診断・比較・仕上げタブは、手動検証、詳細確認、部分的な再実行用として残しています。

## Figmaに記録されるボード

`一連のプロセスをFigmaに配置` で、以下が横方向に流れる1枚のボードとして生成されます。

- Project Header
- 30 Ideas Explore
- 15 Typography Drafts
- 5 Refined SVGs
- Diagnosis
- Compare
- Background Variations
- Final Candidate

## API設定

APIを使う場合は、`src/config/apiSettings.example.ts` をコピーして `src/config/apiSettings.ts` を作ります。

```bash
cp src/config/apiSettings.example.ts src/config/apiSettings.ts
```

`apiSettings.ts` にDify / GeminiのURLとAPI keyを入れてください。実キーはコミットしないでください。  
Providerの切り替えは `src/config/providers.ts` で行います。API未設定またはAPI失敗時はDemo Modeにfallbackします。

Difyは30案探索、15案整理、Typography Draft用Layout JSON、5案選定、診断、比較を担当します。Geminiは5案の高品質SVG化と背景3案生成を担当します。15案ドラフトの安定化方針は [SVGテンプレート戦略](docs/svg-template-strategy.md) にまとめています。

## Webローカルで確認できる範囲

- React UI
- Demoデータ
- SVGプレビュー
- 30案 / 15ドラフト / 5高品質SVGの表示

## Figma内でしか確認できない範囲

- SVGをFigmaに配置
- 横長プロセスボード生成
- 選択フレーム診断
- 複数フレーム比較
- 背景レイヤー適用

## 関連docs

- [自動制作フロー](docs/auto-production-flow.md)
- [新ワークフロー](docs/new-workflow.md)
- [Figmaプロセスボード](docs/figma-process-board.md)
- [Live APIフロー](docs/api-live-flow.md)
- [Difyワークフロー仕様](docs/dify-workflow-spec.md)
- [Gemini仕上げ仕様](docs/gemini-refine-spec.md)
- [SVGテンプレート戦略](docs/svg-template-strategy.md)
- [Figmaプラグインテスト](docs/figma-plugin-test.md)
- [API設定](docs/api-settings.md)
