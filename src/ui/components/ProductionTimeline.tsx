import { Check, Circle, LoaderCircle, TriangleAlert } from "lucide-react";
import type { ProductionStage } from "../../schemas/production";

export type ProductionTimelineItem = {
  stage: ProductionStage;
  title: string;
  description: string;
  figmaStage?: boolean;
};

type ProductionTimelineProps = {
  currentStage: ProductionStage;
  items: ProductionTimelineItem[];
};

const stageOrder: ProductionStage[] = [
  "input_ready",
  "exploring_ideas",
  "placing_ideas_board",
  "generating_typography_drafts",
  "placing_typography_board",
  "selecting_refined_candidates",
  "generating_refined_svgs",
  "placing_refined_board",
  "running_auto_compare",
  "placing_compare_board",
  "generating_backgrounds",
  "placing_background_board",
  "placing_final_candidate",
  "completed",
];

export function ProductionTimeline({ currentStage, items }: ProductionTimelineProps) {
  const currentIndex = stageOrder.indexOf(currentStage);
  const normalizedCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  const currentItem = items.find((item) => item.stage === currentStage) ?? items[normalizedCurrentIndex] ?? items[0];
  const nextItem = currentStage === "completed" || currentStage === "error" ? undefined : items[normalizedCurrentIndex + 1];
  const currentStatus = currentStage === "error" ? "error" : currentStage === "completed" ? "completed" : "running";
  const CurrentIcon = currentStatus === "completed" ? Check : currentStatus === "error" ? TriangleAlert : LoaderCircle;

  return (
    <div className="production-timeline production-timeline-compact">
      <div className={`production-now ${currentStatus}`}>
        <span className="production-step-icon">
          <CurrentIcon size={16} aria-hidden="true" />
        </span>
        <span className="production-step-copy">
          <small>現在の工程</small>
          <strong>{currentItem?.title ?? "制作ジョブを確認"}</strong>
          <span>{currentItem?.description ?? "入力内容を確認しています。"}</span>
        </span>
      </div>
      {nextItem && (
        <div className="production-next">
          <small>次に起きること</small>
          <strong>{nextItem.title}</strong>
        </div>
      )}
      <details className="production-details">
        <summary>全ステップを表示</summary>
        <div className="production-step-list">
          {items.map((item) => {
            const itemIndex = stageOrder.indexOf(item.stage);
            const status = getStatus(currentStage, currentIndex, itemIndex);
            const Icon = status === "completed" ? Check : status === "running" ? LoaderCircle : status === "error" ? TriangleAlert : Circle;
            return (
              <div className={`production-step ${status}`} key={item.stage}>
                <span className="production-step-icon">
                  <Icon size={14} aria-hidden="true" />
                </span>
                <span className="production-step-copy">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  {item.figmaStage && status === "completed" && <em>Figmaに記録済み</em>}
                  {item.figmaStage && status === "running" && <em>Figmaへ記録中</em>}
                </span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function getStatus(currentStage: ProductionStage, currentIndex: number, itemIndex: number): "pending" | "running" | "completed" | "error" {
  if (currentStage === "error") return "error";
  if (currentStage === "completed") return "completed";
  if (itemIndex < currentIndex) return "completed";
  if (itemIndex === currentIndex) return "running";
  return "pending";
}
