import type { Direction } from "../../schemas/direction";
import { contentTypeLabels } from "../labels";
import { getDirectionBestFor } from "../presentation/directionPresentation";

type DirectionCardProps = {
  direction: Direction;
};

export function DirectionCard({ direction }: DirectionCardProps) {
  return (
    <article className="item-card">
      <div>
        <h3>{direction.title}</h3>
        <p>{direction.intent}</p>
      </div>
      <dl className="detail-list">
        <div>
          <dt>メインコピー</dt>
          <dd>{direction.copy.main}</dd>
        </div>
        <div>
          <dt>サブコピー</dt>
          <dd>{direction.copy.sub}</dd>
        </div>
        {direction.copy.cta && (
          <div>
            <dt>CTA</dt>
            <dd>{direction.copy.cta}</dd>
          </div>
        )}
        <div>
          <dt>意図</dt>
          <dd>{direction.intent}</dd>
        </div>
        <div>
          <dt>懸念</dt>
          <dd>{direction.riskNote ?? "大きな懸念はありません。"}</dd>
        </div>
        <div>
          <dt>向いている用途</dt>
          <dd>{getDirectionBestFor(direction)}</dd>
        </div>
      </dl>
      <div className="mini-meta">
        <span>{contentTypeLabels[direction.contentType]}</span>
        <span>{direction.layoutType}</span>
        <span>{direction.tone.join(" / ")}</span>
      </div>
    </article>
  );
}
