# AI Cover Studio Figma Plugin

AI Cover Studioは、完成バナーを1枚だけ作るためのツールではありません。  
AIが探索したコピー、文字組み、SVG案、比較、背景仕上げの過程をFigma上に記録し、デザイナーが判断できるようにするFigmaプラグインです。

## 新しい制作フロー

1. A1 / 30案探索  
   Dify想定でコピー、訴求軸、トーン、レイアウト方向を30案広げます。

2. A2 / 15案文字組みドラフト  
   30案を整理し、15案のTypography Draft SVGを作ります。完成デザインではなく、文字サイズ、余白、CTA位置、日時情報の見え方を確認します。

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
4. 探索画面で `Demoフローを再読み込み`
5. `一連のプロセスをFigmaに配置`
6. Figmaキャンバス上に5つの実バナー案と横長プロセスボードが配置される
7. 1案を選択して診断
8. 2から5案を選択して比較
9. 仕上げ画面で背景を生成、適用

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

- [新ワークフロー](docs/new-workflow.md)
- [Figmaプロセスボード](docs/figma-process-board.md)
- [Difyワークフロー仕様](docs/dify-workflow-spec.md)
- [Gemini仕上げ仕様](docs/gemini-refine-spec.md)
- [Figmaプラグインテスト](docs/figma-plugin-test.md)
- [API設定](docs/api-settings.md)
