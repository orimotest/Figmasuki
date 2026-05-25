import type { InputMode } from "../../schemas/input";
import { inputModeLabels } from "../labels";

type InputModeSelectorProps = {
  value: InputMode;
  onChange: (mode: InputMode) => void;
};

const inputModes: Array<{ mode: InputMode; label: string; disabled?: boolean }> = [
  { mode: "brief_text", label: inputModeLabels.brief_text },
  { mode: "fixed_copy", label: inputModeLabels.fixed_copy },
  { mode: "pdf", label: inputModeLabels.pdf, disabled: true },
  { mode: "figma_variation", label: inputModeLabels.figma_variation, disabled: true },
];

export function InputModeSelector({ value, onChange }: InputModeSelectorProps) {
  return (
    <div className="segmented-control" role="group" aria-label="入力モード">
      {inputModes.map(({ mode, label, disabled }) => (
        <button
          key={mode}
          type="button"
          className={mode === value ? "segment active" : "segment"}
          disabled={disabled}
          onClick={() => onChange(mode)}
          title={disabled ? "今後対応予定です" : label}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
