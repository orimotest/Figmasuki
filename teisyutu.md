# 提出サマリー

## 拡張機能の目的

要件入力から、Figmaで検討できる制作工程一式をまとめて出力するFigmaプラグインです。
強みは「一括生成」と「生成物をFigma上で見ながら検討できること」です。

## 主な機能

- 要件入力、Markdown入力、PDF抽出、Figma参照入力
- 要件整理ボードのFigma出力
- 自動制作フローの一括実行
- 方向性探索、15案Typography Draft、5案SVG、比較、背景、Final Candidateの工程ボード出力
- 選択フレーム診断
- 5案比較と背景生成指示
- Final CandidateのFigma出力
- demoとAPIの明確な分離

## API連携の状態

- API設定は `src/config/apiSettings.ts` に集約
- 設定タブでAPIキーを入力しない
- `localStorage` / `clientStorage` にAPIキーを保存しない
- Difyが設定されていればDify workflowを使用
- Geminiが設定されていればSVG生成と背景生成を使用
- APIモードで失敗した場合、demoへ自動フォールバックしない
- Geminiのみで一括生成する場合、実行前に確認ポップアップを表示

## Difyで必要なWorkflow

1. `inputOrganizer`: 要件整理
2. `ideaExplorer`: 方向性探索
3. `typographyPlanner`: 15案文字組み
4. `candidateSelector`: 5案選定
5. `diagnosis`: 診断
6. `compare`: 比較と背景指示

プロンプトは [Dify.md](Dify.md) にまとめています。

## Figmaへの出力構造

- Requirement Document Board
- 00 Production Timeline
- 01 Project Header
- 02 Ideas Explore
- 03 15 Typography Drafts
- 04 5 Refined SVGs
- 05 Compare
- 06 Background Variations
- 07 Final Candidate
- 実寸の5案SVG
- 実寸のFinal Candidate

Final Candidateは背景画像、可読性レイヤー、編集可能SVGレイヤーを分けて出力します。
背景と文字が合わない場合も、Figma上で背景や文字を調整できます。

## 今回の修正ポイント

- `00 Requirement Document Board` の出力位置を工程ボードの左側に整理
- APIキー入力UIを削除し、コード側設定へ移行
- APIモードでdemoデータが出ないように分離
- Dify Typography Planner / Candidate Selectorの結果を自動制作フローへ反映
- 15案Typography Draftの不自然な1文字改行を抑制
- Final Candidateで背景に文字が負ける問題を、可読性レイヤーで軽減
- 背景生成で文字やロゴを作らない指示を追加
- 最終SVGに内部ラベルを入れない指示を追加
- 診断サマリーUIを読みやすく調整
- demo SVGのCTA重なりと余白不足を修正

## API担当者に渡すもの

- GitHubリンク
- [API.md](API.md)
- [Dify.md](Dify.md)
- `src/config/apiSettings.ts`
- `src/config/apiSettings.example.ts`
- `manifest.json`

## 確認コマンド

```powershell
npm.cmd run typecheck
npm.cmd run build
```

上記が通れば、Figma Desktopで `manifest.json` を読み込んで動作確認できます。
