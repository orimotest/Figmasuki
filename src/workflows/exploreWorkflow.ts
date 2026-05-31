import { isRuntimeApiMode } from "../config/runtimeApiSettings";
import { explore } from "../providers";
import { demoExplore } from "../providers/demo/demoExplore";
import type { ExploreInput } from "../schemas/input";
import type { ExploreResult } from "../schemas/svg";

export async function runExploreWorkflow(input: ExploreInput): Promise<ExploreResult> {
  const result = await explore(input);
  if (result.directions.length === 0) {
    throw new Error("Provider returned no directions.");
  }
  if (result.directions.length >= 5) {
    return {
      ...result,
      directions: result.directions.slice(0, 5),
      selectedCount: 5,
    };
  }
  if (isRuntimeApiMode()) {
    throw new Error(`探索AIの返却が不足しています。5案必要ですが ${result.directions.length} 案でした。Dify/Geminiの出力スキーマを確認してください。`);
  }

  const demoResult = await demoExplore(input);
  const existingIds = new Set(result.directions.map((direction) => direction.id));
  const supplementalDirections = demoResult.directions.filter((direction) => !existingIds.has(direction.id));
  return {
    ...result,
    selectedCount: 5,
    directions: [...result.directions, ...supplementalDirections].slice(0, 5),
    providerMeta: {
      provider: result.providerMeta?.provider ?? "demo",
      fallbackUsed: true,
      fallbackReason: result.providerMeta?.fallbackReason
        ? `${result.providerMeta.fallbackReason} / 5案に満たない方向性をdemoで補完しました。`
        : "5案に満たない方向性をdemoで補完しました。",
    },
  };
}
