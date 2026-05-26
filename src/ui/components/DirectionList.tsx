import type { Direction } from "../../schemas/direction";
import { DirectionCard } from "./DirectionCard";
import { EmptyState } from "./EmptyState";

type DirectionListProps = {
  directions: Direction[];
  onLoadDemo?: () => void;
};

export function DirectionList({ directions, onLoadDemo }: DirectionListProps) {
  if (directions.length === 0) {
    return (
      <EmptyState
        title="コピー方向性はまだありません"
        body="要件を入力して自動制作を開始すると、AIが探索した方向性がここに表示されます。サンプルから開始すると、すぐに制作フローを確認できます。"
        actionLabel={onLoadDemo ? "サンプルから開始" : undefined}
        onAction={onLoadDemo}
      />
    );
  }

  return (
    <div className="item-list">
      {directions.map((direction) => (
        <DirectionCard key={direction.id} direction={direction} />
      ))}
    </div>
  );
}
