import type { Direction } from "../../schemas/direction";
import { contentTypeLabels } from "../labels";

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
          <dt>Main copy</dt>
          <dd>{direction.copy.main}</dd>
        </div>
        <div>
          <dt>Sub copy</dt>
          <dd>{direction.copy.sub}</dd>
        </div>
        {direction.copy.cta && (
          <div>
            <dt>CTA</dt>
            <dd>{direction.copy.cta}</dd>
          </div>
        )}
        <div>
          <dt>レイアウト方針</dt>
          <dd>{direction.layoutBrief.description}</dd>
        </div>
        <div>
          <dt>懸念</dt>
          <dd>{direction.riskNote ?? "大きな懸念はありません。"}</dd>
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
