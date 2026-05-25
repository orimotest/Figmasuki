import { useEffect, useState } from "react";
import type { BackgroundBrief, BackgroundResult } from "../../schemas/background";
import type { ComparisonResult } from "../../schemas/comparison";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { runFinishWorkflow } from "../../workflows/finishWorkflow";
import { buildProjectData } from "../projectBuilder";
import { CanvasBadge } from "../components/CanvasBadge";
import { ErrorMessage } from "../components/ErrorMessage";
import { FinishPanel } from "../components/FinishPanel";
import { LoadingState } from "../components/LoadingState";
import { ProcessTimeline, type ProcessTimelineStep } from "../components/ProcessTimeline";
import { ProviderBadge } from "../components/ProviderBadge";
import { SectionHeader } from "../components/SectionHeader";
import { StatusLog } from "../components/StatusLog";
import { SuccessMessage } from "../components/SuccessMessage";

type FinishScreenProps = {
  providers: ProviderConfig;
  backgroundBrief: BackgroundBrief | null;
  comparisonResult?: ComparisonResult;
  projectData: ProjectData | null;
  onProjectData: (project: ProjectData) => void;
  onBackground: (result: BackgroundResult) => void;
};

export function FinishScreen({ providers, backgroundBrief, comparisonResult, projectData, onProjectData, onBackground }: FinishScreenProps) {
  const [backgroundResult, setBackgroundResult] = useState<BackgroundResult | undefined>();
  const [statusLogs, setStatusLogs] = useState<string[]>(backgroundBrief ? ["background briefを読み込みました。"] : ["比較画面でベース案を選んでください。"]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [styleChoice, setStyleChoice] = useState("soft");

  useEffect(() => {
    setBackgroundResult(undefined);
    setStatusLogs(backgroundBrief ? ["background briefを読み込みました。"] : ["比較画面でベース案を選んでください。"]);
    setError(null);
    setSuccess(null);
  }, [backgroundBrief]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ pluginMessage?: PluginResponseMessage }>) => {
      const message = event.data.pluginMessage;
      if (!message) return;
      if (message.type === "PLUGIN_SUCCESS") {
        setSuccess(message.payload.message);
        setError(null);
        setIsApplying(false);
        setStatusLogs((entries) => [...entries, message.payload.message]);
      }
      if (message.type === "PLUGIN_ERROR") {
        setError(message.payload.message);
        setIsApplying(false);
        setStatusLogs((entries) => [...entries, `Figmaエラー: ${message.payload.message}`]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  async function handleGenerateBackground() {
    if (!backgroundBrief) {
      setError("background briefがありません。比較画面でベース案を選んでから仕上げに進んでください。");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsGenerating(true);
    setStatusLogs((entries) => [...entries, "背景を生成しています。"]);
    try {
      const result = await runFinishWorkflow({ ...backgroundBrief, style: `${backgroundBrief.style} / ${styleChoice}` });
      setBackgroundResult(result);
      onBackground(result);
      if (projectData) {
        onProjectData(buildProjectData({ ...projectDataToBuilder(projectData), backgroundResult: result }));
      }
      setStatusLogs((entries) => [...entries, "背景生成が完了しました。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "背景生成に失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleApplyBackground() {
    if (!backgroundBrief) {
      setError("background briefがありません。");
      return;
    }
    if (!backgroundResult) {
      setError("先に背景を生成してください。");
      return;
    }
    if (!backgroundBrief.targetFrameId) {
      setError("対象フレームIDがありません。比較画面からやり直してください。");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsApplying(true);
    setStatusLogs((entries) => [...entries, "対象フレームに背景を適用しています。"]);
    postToPlugin({ type: "APPLY_BACKGROUND", payload: { targetFrameId: backgroundBrief.targetFrameId, backgroundResult } });
  }

  function handleRenderFinishBoard() {
    if (!backgroundResult) {
      setError("仕上げボードを追加するには、先に背景を生成してください。");
      return;
    }
    postToPlugin({ type: "RENDER_FINISH_BOARD", payload: { backgroundResult, comparisonResult } });
  }

  return (
    <div className="finish-layout">
      <section className="panel finish-controls">
        <SectionHeader
          title="仕上げ"
          description="選ばれた案だけに、文字を邪魔しない背景を追加します。"
          aside={<ProviderBadge label="背景" provider={providers.background} />}
        />
        <div className="badge-row">
          <CanvasBadge />
          {backgroundBrief && <span className="provider-badge">{backgroundBrief.targetFrameName}</span>}
        </div>
        <ProcessTimeline steps={getFinishTimeline(Boolean(backgroundBrief), Boolean(backgroundResult), isGenerating, isApplying, Boolean(error), Boolean(success))} />
        {(isGenerating || isApplying) && (
          <LoadingState
            title={isGenerating ? "背景を生成しています" : "背景を適用しています"}
            description={isGenerating ? "文字領域を邪魔しない背景方針に変換しています。" : "背景レイヤーだけを差し替え、テキストとCTAは残します。"}
          />
        )}

        <label className="field">
          <span>背景スタイル候補</span>
          <select value={styleChoice} onChange={(event) => setStyleChoice(event.target.value)}>
            <option value="soft">ソフトなテック系</option>
            <option value="editorial">編集感のある紙面</option>
            <option value="geometric">控えめな幾何学</option>
          </select>
        </label>
        <button className="primary-button" type="button" disabled={!backgroundBrief || isGenerating} onClick={handleGenerateBackground}>
          {isGenerating ? "背景生成中..." : "背景を生成"}
        </button>
        <button className="secondary-button" type="button" disabled={!backgroundResult || isApplying} onClick={handleApplyBackground}>
          {isApplying ? "適用中..." : "背景を適用"}
        </button>
        <button className="secondary-button" type="button" disabled={!backgroundResult} onClick={handleRenderFinishBoard}>
          仕上げボードをFigmaに追加
        </button>
        {error && <ErrorMessage title="仕上げを実行できませんでした" detail={error} action="比較画面でベース案を選び、background briefを送ってから実行してください。" />}
        {success && <SuccessMessage title={success} detail="テキストやCTAは編集可能なまま残っています。" />}
        <StatusLog entries={statusLogs} />
      </section>
      <section className="panel finish-result">
        <FinishPanel brief={backgroundBrief} result={backgroundResult} />
      </section>
    </div>
  );
}

function getFinishTimeline(hasBrief: boolean, hasBackground: boolean, isGenerating: boolean, isApplying: boolean, hasError: boolean, hasSuccess: boolean): ProcessTimelineStep[] {
  return [
    { label: "対象案を確認", description: "比較からbackground briefを受け取る", status: hasError ? "error" : hasBrief ? "completed" : "pending" },
    { label: "背景方針を確認", description: "避けることと文字領域を確認", status: hasBrief ? "completed" : "pending" },
    { label: "背景を生成", description: "文字を邪魔しない背景を作る", status: hasBackground ? "completed" : isGenerating ? "running" : "pending" },
    { label: "Figmaへ適用", description: "背景レイヤーだけを差し替える", status: hasSuccess ? "completed" : isApplying ? "running" : "pending" },
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
    diagnosisResults: project.diagnosisResults,
    comparisonResult: project.comparisonResult,
  };
}
