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
        body="要件を入力して探索を開始すると、5方向のコピー案がここに表示されます。APIなしでもDemoサンプルで確認できます。"
        actionLabel={onLoadDemo ? "Demoサンプルを読み込む" : undefined}
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
