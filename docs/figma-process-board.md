# Figma Process Board

AI Cover Studioでは、完成物だけでなく制作プロセスをFigma上に記録します。

現在は1つの巨大なFull Processフレームにまとめるのではなく、工程ごとの独立したボードを左から右へ配置します。

## 生成されるボード

- `01 Project Header`
- `02 30 Ideas Explore`
- `03 15 Typography Drafts`
- `04 5 Refined SVGs`
- `05 Compare Result`
- `06 Background Variations`
- `07 Final Candidate`

手動診断を実行した場合は、別途 `Diagnosis Board` を出力できます。

## 出力タイミング

`自動制作を開始` を押すと、工程完了ごとにFigmaへ記録します。

1. 30案探索が終わったら `30 Ideas Explore`
2. 15案文字組みが終わったら `15 Typography Drafts`
3. 5案SVG化が終わったら `5 Refined SVGs`
4. 自動比較が終わったら `Compare Result`
5. 背景3案生成が終わったら `Background Variations`
6. 最後に `Final Candidate`

## 各ボードの役割

### Project Header

案件の前提条件を記録します。

- プロジェクト名
- 用途
- サイズ
- 入力要件
- ターゲット
- ゴール
- 実行モード

### 30 Ideas Explore

30件のコピー・訴求方向を、5つの方向に整理して表示します。

この段階ではSVGを置きません。AIがどの方向を探索し、どれを文字組み工程へ進めるかを確認するためのボードです。

### 15 Typography Drafts

15件の文字組みドラフトSVGを並べます。

完成デザインではなく、以下を見るための軽量SVGです。

- 主見出しの位置
- サブコピーの位置
- 日時情報
- CTA位置
- 余白
- 情報優先順位

### 5 Refined SVGs

高品質化した5案を比較できる形で並べます。

各案は方向性が重ならないようにします。

- 課題共感型
- 参加メリット型
- 実務ノウハウ型
- 信頼感型
- 初心者歓迎型

### Compare Result

5案を自動比較した結果を記録します。

- 各案の役割
- 強み
- 懸念
- 向いている用途
- Primary候補
- Secondary候補
- background brief

### Background Variations

Primary案に対して生成した背景3案を記録します。

文字やCTAを壊さず、背景だけを仕上げる方針です。

### Final Candidate

最終候補、採用理由、編集可能なレイヤー、人間が次に調整するポイントを記録します。

