import { isRuntimeApiMode } from "../config/runtimeApiSettings";
import { generateSvg } from "../providers";
import type { Direction } from "../schemas/direction";
import type { ExploreResult, SvgGenerationResult } from "../schemas/svg";
import type { SvgCandidate } from "../schemas/svg";
import { validateSvg } from "../utils/svgValidator";

type GenerateSvgWorkflowOptions = {
  concurrency?: number;
  onCandidate?: (candidate: SvgCandidate, index: number) => void;
};

export async function runGenerateSvgWorkflow(exploreResult: ExploreResult, options: GenerateSvgWorkflowOptions = {}): Promise<SvgGenerationResult> {
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 2, 3));
  const svgs = await runWithConcurrency(exploreResult.directions, concurrency, async (direction, index) => {
    const candidate = await generateSvgSafely(direction);
    options.onCandidate?.(candidate, index);
    return candidate;
  });
  if (svgs.length === 0) {
    throw new Error("Provider returned no SVG candidates.");
  }
  return { svgs };
}

async function generateSvgSafely(direction: Direction): Promise<SvgCandidate> {
  try {
    const candidate = await generateSvg(direction);
    if (candidate.validation.valid) return candidate;
    return createFallbackSvgCandidate(direction, candidate.validation.errors.join(" "));
  } catch (error) {
    if (isRuntimeApiMode()) {
      throw error;
    }
    const reason = error instanceof Error ? error.message : "SVG生成に失敗しました。";
    return createFallbackSvgCandidate(direction, reason);
  }
}

async function runWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  task: (item: TInput, index: number) => Promise<TOutput>,
): Promise<TOutput[]> {
  const results: TOutput[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await task(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

function createFallbackSvgCandidate(direction: Direction, reason: string): SvgCandidate {
  const now = new Date().toISOString();
  const svg = `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" fill="none">
    <rect width="800" height="450" rx="24" fill="#F8FAFC"/>
    <rect x="32" y="32" width="736" height="386" rx="20" fill="#FFFFFF" stroke="#CBD5E1"/>
    <text x="64" y="92" fill="#2563EB" font-size="22" font-weight="800" font-family="Inter, 'Noto Sans JP', sans-serif">${escapeXml(direction.title)}</text>
    <text x="64" y="172" fill="#0F172A" font-size="48" font-weight="850" font-family="Inter, 'Noto Sans JP', sans-serif">${escapeXml(direction.copy.main.split("\n")[0] ?? direction.copy.main)}</text>
    <text x="64" y="238" fill="#475569" font-size="23" font-weight="650" font-family="Inter, 'Noto Sans JP', sans-serif">${escapeXml(direction.copy.sub ?? "要件に基づく代替SVGです")}</text>
    <rect x="548" y="338" width="190" height="52" rx="26" fill="#16A34A"/>
    <text x="643" y="370" text-anchor="middle" fill="#FFFFFF" font-size="18" font-weight="800" font-family="Inter, 'Noto Sans JP', sans-serif">${escapeXml(direction.copy.cta ?? "詳細を見る")}</text>
    <text x="64" y="382" fill="#64748B" font-size="14" font-weight="600" font-family="Inter, 'Noto Sans JP', sans-serif">Live SVG生成に失敗したため、編集可能な代替SVGで続行しました。</text>
  </svg>`;
  return {
    id: `svg_${direction.id}_fallback`,
    directionId: direction.id,
    contentType: direction.contentType,
    name: `Fallback_${direction.id}`,
    svg,
    width: 800,
    height: 450,
    previewLabel: direction.title,
    validation: validateSvg(svg),
    meta: {
      layoutType: direction.layoutType,
      provider: "demo",
      fallbackUsed: true,
      fallbackReason: reason,
      generatedAt: now,
    },
    createdAt: now,
  };
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
