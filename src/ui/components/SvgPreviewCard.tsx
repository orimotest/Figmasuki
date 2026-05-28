import type { Direction } from "../../schemas/direction";
import type { SvgCandidate } from "../../schemas/svg";
import { getSvgCandidateDescription } from "../presentation/directionPresentation";

type SvgPreviewCardProps = {
  candidate: SvgCandidate;
  direction?: Direction;
  onInsert?: (candidate: SvgCandidate) => void;
  onDiagnose?: (candidate: SvgCandidate) => void;
  onFinish?: (candidate: SvgCandidate) => void;
};

export function SvgPreviewCard({ candidate, direction, onInsert, onDiagnose, onFinish }: SvgPreviewCardProps) {
  return (
    <article className="preview-card">
      <div>
        <div className="svg-preview" dangerouslySetInnerHTML={{ __html: candidate.svg }} />
        <div className="preview-copy">
          <strong>{direction?.title ?? candidate.previewLabel ?? candidate.name}</strong>
          <span>{getSvgCandidateDescription(candidate, direction)}</span>
        </div>
      </div>
      <div className="preview-actions">
        <span className={candidate.validation.valid ? "validation-badge valid" : "validation-badge invalid"}>
          {candidate.validation.valid ? (candidate.validation.warnings.length > 0 ? "SVG確認OK / 注意あり" : "SVG確認OK") : "SVG確認NG"}
        </span>
        {candidate.meta.fallbackUsed && <span className="validation-badge invalid">代替SVG</span>}
        <button className="primary-button compact" type="button" disabled={!candidate.validation.valid} onClick={() => onInsert?.(candidate)}>
          この案をFigmaに配置
        </button>
        {onDiagnose && (
          <button className="secondary-button compact" type="button" onClick={() => onDiagnose(candidate)}>
            この案を診断
          </button>
        )}
        {onFinish && (
          <button className="secondary-button compact" type="button" onClick={() => onFinish(candidate)}>
            この案で背景を仕上げる
          </button>
        )}
      </div>
    </article>
  );
}
