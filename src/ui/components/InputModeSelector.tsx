import type { InputMode } from "../../schemas/input";
import { inputModeLabels } from "../labels";

type InputModeSelectorProps = {
  value: InputMode;
  onChange: (mode: InputMode) => void;
};

const inputModes: Array<{ mode: InputMode; description: string }> = [
  { mode: "minimal_prompt", description: "作りたいものだけ入力" },
  { mode: "brief_text", description: "コピーや要件をまとめて入力" },
  { mode: "pdf", description: "資料テキストから整理" },
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
