import { useMemo } from "react";
import { normalizeRichTextInput } from "../../utils/markdown/normalizeRichText";

type MarkdownInputPanelProps = {
  value: string;
  onChange: (value: string) => void;
};

export function MarkdownInputPanel({ value, onChange }: MarkdownInputPanelProps) {
  const summary = useMemo(() => normalizeRichTextInput(value), [value]);
  return (
    <div className="markdown-input-panel">
      <label className="field full-width primary-input-field">
        <span>Markdown / リッチテキスト要件</span>
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={"# AI活用セミナー\n- 対象: 事業部門の担当者\n- 目的: 明日から試せる使い方を伝える\n- CTA: 無料で参加する"}
        />
      </label>
      <div className="markdown-structure-preview">
        <strong>構造プレビュー</strong>
        <div className="keyword-row">
          <span>見出し {summary.headings.length}</span>
          <span>リスト {summary.listItemCount}</span>
          <span>表 {summary.tableCount}</span>
          <span>ブロック {summary.blocks.length}</span>
        </div>
        {summary.blocks.length > 0 && (
          <ul>
            {summary.blocks.slice(0, 5).map((block) => (
              <li key={block.id}>
                <em>{getBlockLabel(block.type)}</em>
                <span>{block.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function getBlockLabel(type: string): string {
  const labels: Record<string, string> = {
    heading: "見出し",
    paragraph: "本文",
    list: "リスト",
    ordered_list: "番号",
    quote: "引用",
    code: "コード",
    table: "表",
  };
  return labels[type] ?? type;
}
