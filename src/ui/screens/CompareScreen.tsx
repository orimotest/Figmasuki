import { useEffect, useState } from "react";
import type { BackgroundBrief } from "../../schemas/background";
import type { ContentType } from "../../schemas/content";
import type { ComparisonResult } from "../../schemas/comparison";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { runCompareWorkflow } from "../../workflows/compareWorkflow";
import { buildProjectData } from "../projectBuilder";
import { CanvasBadge } from "../components/CanvasBadge";
import { CompareTable } from "../components/CompareTable";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { PresetSelector } from "../components/PresetSelector";
import { ProcessTimeline, type ProcessTimelineStep } from "../components/ProcessTimeline";
import { ProviderBadge } from "../components/ProviderBadge";
import { SectionHeader } from "../components/SectionHeader";
import { StatusLog } from "../components/StatusLog";
import { SuccessMessage } from "../components/SuccessMessage";
import { UsageGuide } from "../components/UsageGuide";

type CompareScreenProps = {
  providers: ProviderConfig;
  projectData: ProjectData | null;
  onProjectData: (project: ProjectData) => void;
  onComparison: (result: ComparisonResult) => void;
  onSendToFinish: (brief: BackgroundBrief) => void;
};

export function CompareScreen({ providers, projectData, onProjectData, onComparison, onSendToFinish }: CompareScreenProps) {
  const [contentType, setContentType] = useState<ContentType>("note_thumbnail");
  const [frames, setFrames] = useState<FigmaFrameData[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | undefined>();
  const [statusLogs, setStatusLogs] = useState<string[]>(["Figma上で比較したい案を2から5個選択してください。"]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ pluginMessage?: PluginResponseMessage }>) => {
      const message = event.data.pluginMessage;
      if (!message) return;
      if (message.type === "SELECTION_FRAMES_RESULT") {
        setFrames(message.payload);
        setStatusLogs((entries) => [...entries, `${message.payload.length}案を取得しました。`, "各案の役割を整理しています。"]);
        if (message.payload.length > 5) {
          setStatusLogs((entries) => [...entries, "2〜5案での比較を推奨します。今回は選択中の案をそのまま比較します。"]);
        }
        void runComparison(message.payload, contentType);
      }
      if (message.type === "PLUGIN_SUCCESS") {
        setSuccess(message.payload.message);
        setStatusLogs((entries) => [...entries, message.payload.message]);
      }
      if (message.type === "PLUGIN_ERROR") {
        setError(message.payload.message);
        setIsComparing(false);
        setStatusLogs((entries) => [...entries, `Figmaエラー: ${message.payload.message}`]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [contentType]);

  function handleCompareSelectedFrames() {
    setError(null);
    setSuccess(null);
    setComparison(undefined);
    setFrames([]);
    setIsComparing(true);
    setStatusLogs(["選択中の案を取得しています。"]);
    postToPlugin({ type: "REQUEST_SELECTED_FRAMES" });
  }

  async function runComparison(selectedFrames: FigmaFrameData[], preset: ContentType) {
    try {
      setStatusLogs((entries) => [...entries, "比較コメントを生成しています。"]);
      const result = await runCompareWorkflow(selectedFrames, preset);
      setComparison(result);
      onComparison(result);
      if (result.providerMeta?.fallbackUsed) {
        setStatusLogs((entries) => [
          ...entries,
          "APIが未設定、または比較APIに接続できないためDemo Modeで比較しました。",
          result.providerMeta?.fallbackReason ?? "Demo比較に切り替えました。",
        ]);
      } else if (result.providerMeta?.provider === "demo") {
        setStatusLogs((entries) => [...entries, "Demo Modeで比較結果を表示しています。"]);
      }
      if (projectData) {
        onProjectData(buildProjectData({ ...projectDataToBuilder(projectData), comparisonResult: result }));
      }
      setError(null);
      setStatusLogs((entries) => [...entries, "比較が完了しました。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "比較に失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsComparing(false);
    }
  }

  function handleRenderCompareBoard() {
    if (!comparison) {
      setError("比較結果をFigmaに記録するには、先に比較を実行してください。");
      return;
    }
    postToPlugin({ type: "RENDER_COMPARE_BOARD", payload: comparison });
  }

  return (
    <div className="compare-layout">
      <section className="panel compare-controls">
        <SectionHeader
          title="比較"
          description="2から5案を比較し、ベース候補と次点候補を整理します。"
          aside={<ProviderBadge label="比較" provider={comparison?.providerMeta?.provider ?? providers.compare} fallbackUsed={comparison?.providerMeta?.fallbackUsed} />}
        />
        <div className="badge-row">
          <CanvasBadge />
          <span className="provider-badge">選択案: {frames.length}</span>
          <span className="provider-badge warning">API未設定でもDemo比較</span>
        </div>
        <UsageGuide
          title="比較の操作"
          note="比較したいFigmaフレームを2〜5個選択してから、比較を実行してください。探索画面で5案をまとめて配置すると、比較用のフレームをすぐに選択できます。"
          steps={["探索画面で「5案をまとめてFigmaに配置」", "Figma上で2〜5案をShiftクリックして選択", "比較画面で「選択中の案を比較」", "background briefを確認し、仕上げへ送る"]}
        />
        <ProcessTimeline steps={getCompareTimeline(isComparing, frames.length > 0, Boolean(comparison), Boolean(error))} />
        {isComparing && <LoadingState title="複数案を比較しています" description="役割、強み、懸念、背景生成briefを整理しています。" />}
        <PresetSelector value={contentType} onChange={setContentType} />
        <button className="primary-button" type="button" disabled={isComparing} onClick={handleCompareSelectedFrames}>
          {isComparing ? "比較中..." : "選択中の案を比較"}
        </button>
        <button className="secondary-button" type="button" disabled={!comparison} onClick={handleRenderCompareBoard}>
          比較結果をFigmaに記録
        </button>
        {error && <ErrorMessage title="比較を実行できませんでした" detail={error} action="Figma上でフレームを2から5個選択して、もう一度実行してください。" />}
        {comparison && <SuccessMessage title="比較が完了しました" detail="ベース候補、次点候補、background briefを確認できます。" />}
        {success && <SuccessMessage title={success} />}
        <SelectedFrameList frames={frames} />
        <StatusLog entries={statusLogs} />
      </section>

      <section className="panel compare-result">
        {!comparison ? (
          <EmptyState
            title="比較する案を2つ以上選択してください"
            body="Figmaキャンバス上で比較したいバナー案を2〜5個選択します。探索画面で5案をまとめて配置してから選択すると、Demo比較をすぐに試せます。"
          />
        ) : (
          <div className="compare-result-stack">
            <section className="diagnosis-section">
              <h3>比較概要</h3>
              <p>{comparison.comparisonSummary}</p>
            </section>
            <CompareTable result={comparison} />
            <section className="recommendation-grid">
              <RecommendationCard title="ベース候補" frameName={findFrameName(comparison, comparison.recommendation.primaryFrameId)} reason={comparison.recommendation.primaryReason} />
              <RecommendationCard title="次点候補" frameName={comparison.recommendation.secondaryFrameId ? findFrameName(comparison, comparison.recommendation.secondaryFrameId) : "なし"} reason={comparison.recommendation.secondaryReason ?? "次点候補は生成されませんでした。"} />
            </section>
            <section className="background-brief-box">
              <div>
                <h3>background brief</h3>
                <p>{comparison.backgroundBrief.promptText}</p>
                <div className="mini-meta">
                  <span>{comparison.backgroundBrief.targetFrameName}</span>
                  <span>{comparison.backgroundBrief.mood}</span>
                  <span>{comparison.backgroundBrief.style}</span>
                </div>
              </div>
              <button className="primary-button compact" type="button" onClick={() => onSendToFinish(comparison.backgroundBrief)}>
                この案で背景を仕上げる
              </button>
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function SelectedFrameList({ frames }: { frames: FigmaFrameData[] }) {
  if (frames.length === 0) {
    return (
      <section className="frame-summary empty">
        <h3>選択中の案</h3>
        <p className="muted">Figma上で比較したい案を2から5個選択してください。</p>
      </section>
    );
  }
  return (
    <section className="frame-summary">
      <h3>選択中の案</h3>
      <div className="selected-frame-list">
        {frames.map((frame) => (
          <article className="selected-frame-item" key={frame.id}>
            <strong>{frame.name}</strong>
            <span>{frame.width}x{frame.height} / テキスト {frame.derived.textCount}</span>
            <span>{frame.derived.possibleMainTitle?.characters || "タイトル候補なし"}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

function getCompareTimeline(isRunning: boolean, hasFrames: boolean, hasResult: boolean, hasError: boolean): ProcessTimelineStep[] {
  return [
    { label: "複数フレーム選択", description: "2から5案を取得", status: hasError ? "error" : hasFrames || isRunning ? "completed" : "pending" },
    { label: "差分を抽出", description: "文字、CTA、用途を比較", status: hasError ? "error" : hasResult ? "completed" : isRunning ? "running" : "pending" },
    { label: "役割を整理", description: "各案が向いている用途を言語化", status: hasResult ? "completed" : isRunning ? "running" : "pending" },
    { label: "ベース候補を選定", description: "仕上げに進む案を決める", status: hasResult ? "completed" : "pending" },
    { label: "background brief作成", description: "背景生成の判断材料を準備", status: hasResult ? "completed" : "pending" },
  ];
}

function RecommendationCard({ title, frameName, reason }: { title: string; frameName: string; reason: string }) {
  return (
    <article className="recommendation-card">
      <span>{title}</span>
      <strong>{frameName}</strong>
      <p>{reason}</p>
    </article>
  );
}

function findFrameName(result: ComparisonResult, frameId: string): string {
  return result.frames.find((frame) => frame.id === frameId)?.name ?? frameId;
}

function projectDataToBuilder(project: ProjectData) {
  return {
    exploreResult: {
      contentType: project.contentType,
      inputMode: project.inputMode,
      canvasSize: project.canvasSize,
      exploredCount: 30 as const,
      selectedCount: 5 as const,
      input: {
        contentType: project.contentType,
        inputMode: project.inputMode,
        briefText: project.inputSummary.brief,
        targetAudience: project.inputSummary.targetAudience,
        rawInput: project.inputSummary.rawInput,
      },
      directions: project.copyDirections,
      providerMeta: project.providerMeta.copy,
    },
    svgCandidates: project.svgCandidates,
    diagnosisResults: project.diagnosisResults,
    backgroundResult: project.backgroundResult,
  };
}
