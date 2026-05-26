# AI Cover Studio Figma Plugin

AI Cover Studioは、完成バナーを1枚だけ作るためのプラグインではありません。  
AIが考えたコピー、文字組み、SVG候補、比較、背景仕上げのプロセスをFigma上に記録し、デザイナーが判断しやすくするためのFigmaローカルプラグインです。

## 制作フロー

1. 要件入力
2. 30案探索
3. 15案文字組みドラフト
4. 5案高品質SVG
5. 比較・評価
6. 背景3案生成
7. Final Candidate

ユーザーは「自動制作を開始」を押すだけで、各工程のボードとSVGがFigmaキャンバスへ順番に記録されます。診断、比較、仕上げタブは、自動制作後の詳細確認や再実行用です。

## セットアップ

```bash
npm install
npm run build
```

Figma Desktopでローカルプラグインとして読み込む手順:

1. `npm run build`
2. Figma Desktopを開く
3. `Plugins > Development > Import plugin from manifest...`
4. リポジトリ直下の `manifest.json` を選択
5. `Plugins > Development` からプラグインを起動

## サンプルで制作フローを確認する

API設定が未完了の場合は、実行モード: Demoで制作フローを確認できます。

1. プラグインを起動
2. 自動制作タブで「サンプルから開始」
3. 「自動制作を開始」
4. Production Timelineで進行状況を確認
5. Figmaキャンバス上に工程別ボードと5案SVGが出ることを確認
6. Final Candidateまで生成されることを確認

## Live Modeで使う

プラグイン内の設定タブ、または `src/config/apiSettings.ts` にDify / Geminiの接続情報を入れるとLive Modeへ接続できます。

設定の優先順位:

1. Figma `clientStorage` に保存された設定
2. `src/config/apiSettings.ts`
3. `src/config/apiSettings.example.ts` はサンプルのみ

実キーはGitに入れないでください。`.gitignore` では `src/config/apiSettings.ts` を除外対象にしています。

詳しい設定方法は [APIset.md](APIset.md) と [gemini.md](gemini.md) を参照してください。

## Dify / Geminiの分担

Dify:
- Input Organizer: 入力を `NormalizedCreativeInput` に整理
- Idea Explorer: 30案探索
- Typography Planner: 15案のLayout Draft JSONを作成
- Candidate Selector: 15案から5案を選定
- Diagnosis: 診断コメント生成
- Compare: 比較結果とbackground brief生成

Gemini:
- 5案の高品質SVG化
- Primary案に対する背景3案生成

重要: Difyには15案SVGを完全自由生成させず、Layout Draft JSONを返させます。プラグイン側がテンプレートからTypography Draft SVGを生成することで、Figma貼り付けの安定性を上げます。

## Webローカルで確認できる範囲

- React UI
- 入力モード
- サンプルデータ
- Production Timeline
- SVGプレビュー

## Figma内でしか確認できない範囲

- SVGをFigmaに配置
- 工程別プロセスボード生成
- 選択フレーム診断
- 複数フレーム比較
- 背景レイヤー適用

## 関連docs

- [APIset.md](APIset.md)
- [gemini.md](gemini.md)
- [docs/dify-workflows.md](docs/dify-workflows.md)
- [docs/auto-production-flow.md](docs/auto-production-flow.md)
- [docs/figma-process-board.md](docs/figma-process-board.md)
- [docs/svg-template-strategy.md](docs/svg-template-strategy.md)
- [docs/troubleshooting.md](docs/troubleshooting.md)
