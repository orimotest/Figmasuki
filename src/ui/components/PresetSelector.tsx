import { contentPresets } from "../../config/presets";
import type { ContentType } from "../../schemas/content";

type PresetSelectorProps = {
  value: ContentType;
  onChange: (contentType: ContentType) => void;
};

export function PresetSelector({ value, onChange }: PresetSelectorProps) {
  return (
    <label className="field">
      <span>用途</span>
      <select value={value} onChange={(event) => onChange(event.target.value as ContentType)}>
        {contentPresets.map((preset) => (
          <option key={preset.contentType} value={preset.contentType}>
            {preset.label}
          </option>
        ))}
      </select>
    </label>
  );
}
