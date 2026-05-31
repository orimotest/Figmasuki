import type { InputMode } from "../../schemas/input";
import { inputModeLabels } from "../labels";

type InputModeSelectorProps = {
  value: InputMode;
  onChange: (mode: InputMode) => void;
};

const inputModes: Array<{ mode: InputMode; description: string }> = [
  { mode: "minimal_prompt", description: "作りたいものだけで開始" },
  { mode: "brief_text", description: "概要文を貼り付け" },
  { mode: "fixed_copy", description: "コピーを固定" },
  { mode: "pdf", description: "資料から整理" },
  { mode: "markdown", description: "Notion/ChatGPTを貼る" },
  { mode: "figma_reference", description: "選択フレームを参考" },
];

export function InputModeSelector({ value, onChange }: InputModeSelectorProps) {
  return (
    <div className="segmented-control input-mode-grid" role="group" aria-label="入力モード">
      {inputModes.map(({ mode, description }) => (
        <button
          key={mode}
          type="button"
          className={mode === value ? "segment active" : "segment"}
          onClick={() => onChange(mode)}
          title={description}
        >
          <strong>{inputModeLabels[mode]}</strong>
          <small>{description}</small>
        </button>
      ))}
    </div>
  );
}
