import type { Direction } from "../../schemas/direction";
import { DirectionCard } from "./DirectionCard";
import { EmptyState } from "./EmptyState";

type DirectionListProps = {
  directions: Direction[];
};

export function DirectionList({ directions }: DirectionListProps) {
  if (directions.length === 0) {
    return <EmptyState title="方向性はまだありません" body="作りたい内容を入力し、探索を開始してください。" />;
  }

  return (
    <div className="item-list">
      {directions.map((direction) => (
        <DirectionCard key={direction.id} direction={direction} />
      ))}
    </div>
  );
}
