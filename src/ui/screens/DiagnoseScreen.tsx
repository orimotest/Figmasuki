import { useEffect, useState } from "react";
import type { ContentType } from "../../schemas/content";
import type { DiagnosisResult } from "../../schemas/diagnosis";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { runDiagnoseWorkflow } from "../../workflows/diagnoseWorkflow";
import { buildProjectData } from "../projectBuilder";
import { CanvasBadge } from "../components/CanvasBadge";
import { DiagnosisPanel } from "../components/DiagnosisPanel";
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

type DiagnoseScreenProps = {
  providers: ProviderConfig;
  projectData: ProjectData | null;
  onProjectData: (project: ProjectData) => void;
  onDiagnosis: (result: DiagnosisResult) => void;
};

export function DiagnoseScreen({ providers, projectData, onProjectData, onDiagnosis }: DiagnoseScreenProps) {
  const [contentType, setContentType] = useState<ContentType>("note_thumbnail");
  const [selectedFrame, setSelectedFrame] = useState<FigmaFrameData | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | undefined>();
  const [statusLogs, setStatusLogs] = useState<string[]>(["Figma上で診断したいフレームを1つ選択してください。"]);
  const [error, setError] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ pluginMessage?: PluginResponseMessage }>) => {
      const message = event.data.pluginMessage;
      if (!message) return;
      if (message.type === "SELECTION_FRAME_RESULT") {
        setSelectedFrame(message.payload);
        setStatusLogs((entries) => [...entries, "選択フレームを取得しました。", "構造とテキストを読み取っています。"]);
        void runDiagnosis(message.payload, contentType);
      }
      if (message.type === "PLUGIN_SUCCESS") {
        setSuccess(message.payload.message);
        setStatusLogs((entries) => [...entries, message.payload.message]);
      }
      if (message.type === "PLUGIN_ERROR") {
        setError(message.payload.message);
        setIsDiagnosing(false);
        setSelectedFrame(null);
        setStatusLogs((entries) => [...entries, `Figmaエラー: ${message.payload.message}`]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [contentType]);

  function handleDiagnoseSelectedFrame() {
    setError(null);
    setSuccess(null);
    setDiagnosis(undefined);
    setSelectedFrame(null);
    setIsDiagnosing(true);
    setStatusLogs(["選択中のフレームを取得しています。"]);
    postToPlugin({ type: "REQUEST_SELECTED_FRAME" });
  }

  async function runDiagnosis(frame: FigmaFrameData, preset: ContentType) {
    try {
      setStatusLogs((entries) => [...entries, `${preset === "note_thumbnail" ? "note" : "セミナー"}用の観点で診断します。`, "診断コメントを生成しています。"]);
      const result = await runDiagnoseWorkflow(frame, preset);
      setDiagnosis(result);
      onDiagnosis(result);
      if (result.providerMeta?.fallbackUsed) {
        setStatusLogs((entries) => [
          ...entries,
          "APIが未設定、または診断APIに接続できないためDemo Modeで診断しました。",
          result.providerMeta?.fallbackReason ?? "Demo診断に切り替えました。",
        ]);
      } else if (result.providerMeta?.provider === "demo") {
        setStatusLogs((entries) => [...entries, "Demo Modeで診断結果を表示しています。"]);
      }
      if (projectData) {
        onProjectData(buildProjectData({ ...projectDataToBuilder(projectData), diagnosisResults: [...projectData.diagnosisResults, result] }));
      }
      setError(null);
      setStatusLogs((entries) => [...entries, "診断が完了しました。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "診断に失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsDiagnosing(false);
    }
  }

  function handleRenderDiagnosisBoard() {
    if (!diagnosis) {
      setError("診断結果をFigmaに記録するには、先に診断を実行してください。");
      return;
    }
    postToPlugin({ type: "RENDER_DIAGNOSIS_BOARD", payload: diagnosis });
  }

  return (
    <div className="diagnose-layout">
      <section className="panel diagnose-controls">
        <SectionHeader
          title="診断"
          description="Figma上で1案だけ選び、最初に伝わることと直す順番を整理します。"
          aside={<ProviderBadge label="診断" provider={diagnosis?.providerMeta?.provider ?? providers.diagnosis} fallbackUsed={diagnosis?.providerMeta?.fallbackUsed} />}
        />
        <div className="badge-row">
          <CanvasBadge />
          <span className="provider-badge">点数評価なし</span>
          <span className="provider-badge warning">API未設定でもDemo診断</span>
        </div>
        <UsageGuide
          title="診断の操作"
          note="診断したいFigmaフレームを1つ選択してから、下のボタンを押してください。まず探索画面で案をFigmaに配置すると、診断用のフレームを作成できます。"
          steps={["探索画面で「5案をまとめてFigmaに配置」", "Figma上で1つの案をクリック", "診断画面で「選択中のフレームを診断」"]}
        />
        <ProcessTimeline steps={getDiagnoseTimeline(isDiagnosing, Boolean(selectedFrame), Boolean(diagnosis), Boolean(error))} />
        {isDiagnosing && <LoadingState title="フレームを診断しています" description="文字階層、余白、CTA、用途との相性を確認しています。" />}
        <PresetSelector value={contentType} onChange={setContentType} />
        <button className="primary-button" type="button" disabled={isDiagnosing} onClick={handleDiagnoseSelectedFrame}>
          {isDiagnosing ? "診断中..." : "選択中のフレームを診断"}
        </button>
        <button className="secondary-button" type="button" disabled={!diagnosis} onClick={handleRenderDiagnosisBoard}>
          診断結果をFigmaに記録
        </button>
        {error && <ErrorMessage title="診断を実行できませんでした" detail={error} action="Figma上でフレームを1つだけ選択してから、もう一度実行してください。" />}
        {diagnosis && <SuccessMessage title="診断が完了しました" detail="強い点、気になる点、最初に直す場所を確認できます。" />}
        {success && <SuccessMessage title={success} />}
        <FrameSummary frame={selectedFrame} />
        <StatusLog entries={statusLogs} />
      </section>
      <section className="panel diagnose-result">
        {diagnosis ? (
          <DiagnosisPanel result={diagnosis} />
        ) : (
          <EmptyState
            title="診断するフレームを選択してください"
            body="Figmaキャンバス上で診断したいバナー案を1つ選択します。探索画面で生成した案を配置してから選択すると、診断を試せます。"
          />
        )}
      </section>
    </div>
  );
}

function FrameSummary({ frame }: { frame: FigmaFrameData | null }) {
  if (!frame) {
    return (
      <section className="frame-summary empty">
        <h3>選択中のフレーム</h3>
        <p className="muted">Figma上で診断したいフレームを1つ選択してください。</p>
      </section>
    );
  }
  return (
    <section className="frame-summary">
      <h3>選択中のフレーム</h3>
      <dl className="detail-list">
        <div>
          <dt>フレーム名</dt>
          <dd>{frame.name}</dd>
        </div>
        <div>
          <dt>サイズ</dt>
          <dd>{frame.width}x{frame.height}{!frame.derived.frameSizeMatchesCanvas && " / 800x450ではありません"}</dd>
        </div>
        <div>
          <dt>テキスト数</dt>
          <dd>{frame.derived.textCount}</dd>
        </div>
        <div>
          <dt>メインタイトル候補</dt>
          <dd>{frame.derived.possibleMainTitle?.characters || "見つかりません"}</dd>
        </div>
      </dl>
    </section>
  );
}

function getDiagnoseTimeline(isRunning: boolean, hasFrame: boolean, hasResult: boolean, hasError: boolean): ProcessTimelineStep[] {
  return [
    { label: "フレーム選択", description: "Figma上の1案を取得", status: hasError ? "error" : hasFrame || isRunning ? "completed" : "pending" },
    { label: "構造チェック", description: "文字、余白、サイズを確認", status: hasError ? "error" : hasResult ? "completed" : isRunning ? "running" : "pending" },
    { label: "診断コメント生成", description: "用途別の観点で言語化", status: hasResult ? "completed" : isRunning ? "running" : "pending" },
    { label: "修正方針を整理", description: "最初に直すならを提示", status: hasResult ? "completed" : "pending" },
  ];
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
    comparisonResult: project.comparisonResult,
    backgroundResult: project.backgroundResult,
  };
}
