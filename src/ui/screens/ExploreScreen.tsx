import { useEffect, useMemo, useRef, useState } from "react";
import type { ContentType } from "../../schemas/content";
import type { Direction } from "../../schemas/direction";
import type { FixedCopyInput, InputMode } from "../../schemas/input";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import type { ExploreResult, SvgCandidate } from "../../schemas/svg";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { runExploreWorkflow } from "../../workflows/exploreWorkflow";
import { runGenerateSvgWorkflow } from "../../workflows/generateSvgWorkflow";
import { buildProjectData } from "../projectBuilder";
import { ActionBar } from "../components/ActionBar";
import { CanvasBadge } from "../components/CanvasBadge";
import { DirectionList } from "../components/DirectionList";
import { ErrorMessage } from "../components/ErrorMessage";
import { EmptyState } from "../components/EmptyState";
import { InputModeSelector } from "../components/InputModeSelector";
import { LoadingState } from "../components/LoadingState";
import { PresetSelector } from "../components/PresetSelector";
import { ProcessTimeline, type ProcessTimelineStep } from "../components/ProcessTimeline";
import { ProviderBadge } from "../components/ProviderBadge";
import { SectionHeader } from "../components/SectionHeader";
import { StatusLog } from "../components/StatusLog";
import { SuccessMessage } from "../components/SuccessMessage";
import { SvgPreviewCard } from "../components/SvgPreviewCard";
import { UsageGuide } from "../components/UsageGuide";

type ExploreScreenProps = {
  providers: ProviderConfig;
  projectData: ProjectData | null;
  onProjectData: (project: ProjectData | null) => void;
};

const sampleBriefs = {
  note_thumbnail: "AI時代にデザイナーが持つべき思考と、これからの制作フローについての記事サムネイル。",
  seminar_banner:
    "オンラインセミナー集客用のバナー。時間のないビジネスパーソンに向けて、短時間で学べる価値を伝えたい。信頼感と親しみやすさを両立したい。",
} satisfies Record<ContentType, string>;

const defaultFixedCopy: FixedCopyInput = {
  main: "60分でわかる\nAI活用の第一歩",
  sub: "業務改善に使える考え方と実践例を紹介",
  cta: "今すぐ申し込む",
};

export function ExploreScreen({ providers, projectData, onProjectData }: ExploreScreenProps) {
  const [contentType, setContentType] = useState<ContentType>("seminar_banner");
  const [inputMode, setInputMode] = useState<InputMode>("brief_text");
  const [briefText, setBriefText] = useState(sampleBriefs.seminar_banner);
  const [fixedCopy, setFixedCopy] = useState<FixedCopyInput>(defaultFixedCopy);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLogs, setStatusLogs] = useState<string[]>(["探索画面を開いたため、Demoフローを自動読み込みします。"]);
  const [exploreResult, setExploreResult] = useState<ExploreResult | null>(null);
  const [svgCandidates, setSvgCandidates] = useState<SvgCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const didAutoRun = useRef(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ pluginMessage?: PluginResponseMessage }>) => {
      const message = event.data.pluginMessage;
      if (!message) return;
      if (message.type === "PLUGIN_SUCCESS") {
        setSuccess(message.payload.message);
        setStatusLogs((entries) => [...entries, message.payload.message]);
        setError(null);
      }
      if (message.type === "PLUGIN_ERROR") {
        setError(message.payload.message);
        setStatusLogs((entries) => [...entries, `Figmaエラー: ${message.payload.message}`]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (didAutoRun.current) return;
    didAutoRun.current = true;
    void runDemoSample("seminar_banner", { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const directionsById = useMemo(() => {
    const map = new Map<string, Direction>();
    exploreResult?.directions.forEach((direction) => map.set(direction.id, direction));
    return map;
  }, [exploreResult]);

  const workflow = projectData?.stageWorkflow;
  const canShowCta = contentType === "seminar_banner";

  function startDemoFlow() {
    void runDemoSample("seminar_banner");
  }

  async function runDemoSample(type: ContentType, options?: { silent?: boolean }) {
    setContentType(type);
    setInputMode("brief_text");
    setBriefText(sampleBriefs[type]);
    setError(null);
    setSuccess(null);
    setIsGenerating(true);
    setStatusLogs(["Demoフローを読み込んでいます。", "30案探索、15文字組みドラフト、5高品質SVGを準備しています。"]);

    try {
      const project = await createProjectFromInput({
        contentType: type,
        inputMode: "brief_text",
        briefText: sampleBriefs[type],
        rawInput: sampleBriefs[type],
        targetAudience: type === "seminar_banner" ? "忙しいビジネスパーソン" : "デザイナー、編集者、個人クリエイター",
      });
      setStatusLogs((entries) => [
        ...entries,
        "Demoフローの読み込みが完了しました。",
        "主ボタンを押すと、5つの実バナー案と横長プロセスボードをFigmaに配置します。",
      ]);
      if (!options?.silent) setSuccess("Demoフローを読み込みました。");
      return project;
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Demoフローの読み込みに失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerateAndPlace() {
    setError(null);
    setSuccess(null);
    const validationMessage = validateInput(inputMode, briefText, fixedCopy, contentType);
    if (validationMessage) {
      setError(validationMessage);
      setStatusLogs((entries) => [...entries, validationMessage]);
      return;
    }

    setIsGenerating(true);
    setStatusLogs(["段階型フローを生成しています。", "Figma配置用のプロセスボードをまとめています。"]);

    try {
      const project =
        exploreResult && svgCandidates.length > 0 && projectData
          ? projectData
          : await createProjectFromInput({
              contentType,
              inputMode,
              briefText: inputMode === "brief_text" ? briefText : undefined,
              fixedCopy: inputMode === "fixed_copy" ? fixedCopy : undefined,
              rawInput: inputMode === "brief_text" ? briefText : `${fixedCopy.main}\n${fixedCopy.sub}\n${fixedCopy.cta ?? ""}`,
              targetAudience: contentType === "seminar_banner" ? "忙しいビジネスパーソン" : "デザイナー、編集者、個人クリエイター",
            });
      if (!project) return;
      setStatusLogs((entries) => [...entries, "Figmaへ5案とプロセスボードを連続配置しています。"]);
      postToPlugin({ type: "PLACE_EXPLORE_PACKAGE", payload: project });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "生成と配置に失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsGenerating(false);
    }
  }

  async function createProjectFromInput(input: Parameters<typeof runExploreWorkflow>[0]): Promise<ProjectData> {
    const result = await runExploreWorkflow(input);
    if (result.providerMeta?.fallbackUsed) {
      setStatusLogs((entries) => [...entries, "APIが未設定、または接続できないためDemo Modeに切り替えました。"]);
    } else if (result.providerMeta?.provider === "demo") {
      setStatusLogs((entries) => [...entries, "Demo Modeでサンプル方向性を表示しています。"]);
    }

    setStatusLogs((entries) => [...entries, `${result.exploredCount}案を探索しました。`, "15案の文字組みドラフトを作成しました。", `${result.selectedCount}案を高品質SVGとして整理しました。`]);
    const svgResult = await runGenerateSvgWorkflow(result);
    const project = buildProjectData({ exploreResult: result, svgCandidates: svgResult.svgs });
    setExploreResult(result);
    setSvgCandidates(svgResult.svgs);
    onProjectData(project);
    return project;
  }

  function handleInsert(candidate: SvgCandidate) {
    if (!candidate.validation.valid) {
      setError(`SVG確認に失敗しました: ${candidate.validation.errors.join(" ")}`);
      return;
    }
    postToPlugin({ type: "INSERT_SVG", payload: { svg: candidate.svg, name: candidate.name } });
  }

  function handleReset() {
    setExploreResult(null);
    setSvgCandidates([]);
    onProjectData(null);
    setError(null);
    setSuccess(null);
    setStatusLogs(["結果をリセットしました。もう一度Demoフローを読み込むか、要件を入力してください。"]);
  }

  return (
    <div className="explore-layout">
      <section className="panel explore-controls">
        <SectionHeader
          title="段階型Explore"
          description="30案探索、15案の文字組みドラフト、5案の高品質SVGまでをDemo Modeで確認できます。"
          aside={<ProviderBadge label="SVG" provider={providers.svg} />}
        />
        <div className="badge-row">
          <CanvasBadge />
          <span className="provider-badge warning">実行モード: Demo Mode対応</span>
          {workflow && <span className="provider-badge">30 → 15 → 5</span>}
        </div>
        <UsageGuide note="主ボタン1つで、5つの実バナー案と横長プロセスボードをFigmaにまとめて配置します。各フェーズの検討内容はボード内に記録されます。" />
        <ProcessTimeline steps={getExploreTimeline(isGenerating, Boolean(workflow), Boolean(error))} />
        {isGenerating && <LoadingState title="段階型フローを準備しています" description="30案探索、15文字組みドラフト、5高品質SVG、Figma用ボードをまとめています。" />}

        <div className="form-grid">
          <PresetSelector value={contentType} onChange={setContentType} />
          <InputModeSelector value={inputMode} onChange={setInputMode} />
          {inputMode === "brief_text" && (
            <label className="field full-width">
              <span>要件</span>
              <textarea value={briefText} onChange={(event) => setBriefText(event.target.value)} placeholder={sampleBriefs[contentType]} />
            </label>
          )}
          {inputMode === "fixed_copy" && (
            <div className="fixed-copy-fields full-width">
              <label className="field">
                <span>メインコピー</span>
                <textarea value={fixedCopy.main} onChange={(event) => setFixedCopy({ ...fixedCopy, main: event.target.value })} />
              </label>
              <label className="field">
                <span>サブコピー</span>
                <input value={fixedCopy.sub} onChange={(event) => setFixedCopy({ ...fixedCopy, sub: event.target.value })} />
              </label>
              {canShowCta && (
                <label className="field">
                  <span>CTA</span>
                  <input value={fixedCopy.cta ?? ""} onChange={(event) => setFixedCopy({ ...fixedCopy, cta: event.target.value })} />
                </label>
              )}
            </div>
          )}
        </div>

        {error && <ErrorMessage title="生成と配置を実行できませんでした" detail={error} action="Demoフローを再読み込みするか、入力内容を確認してください。" />}
        {success && <SuccessMessage title={success} detail="Figma上で5案と横長プロセスボードを確認できます。" />}

        <ActionBar>
          <button className="primary-button" type="button" disabled={isGenerating} onClick={handleGenerateAndPlace}>
            {isGenerating ? "準備中..." : "一連のプロセスをFigmaに配置"}
          </button>
          <button className="secondary-button" type="button" disabled={isGenerating} onClick={startDemoFlow}>
            Demoフローを再読み込み
          </button>
          <button className="ghost-button" type="button" onClick={handleReset}>
            リセット
          </button>
        </ActionBar>
        <StatusLog entries={statusLogs} />
      </section>

      <section className="panel explore-results">
        <SectionHeader title="A1 30案探索" description="コピー、訴求軸、トーン、レイアウト方向を広げます。Figmaボードでは30案すべてを小カードで記録します。" />
        <StageSummary
          count={workflow?.ideaDirections.length ?? 0}
          label="ideaDirections"
          emptyText="Demoフローを読み込むと30案が表示されます。"
          samples={workflow?.ideaDirections.slice(0, 6).map((idea) => `${idea.name}: ${idea.mainCopy}`) ?? []}
        />
        <SectionHeader title="A2 15案文字組みドラフト" description="完成デザインではなく、文字サイズ、余白、CTA位置、日時情報の見え方を検討するSVGです。" />
        <StageSummary
          count={workflow?.typographyDrafts.length ?? 0}
          label="typographyDrafts"
          emptyText="Demoフローを読み込むと15案の文字組みドラフトが表示されます。"
          samples={workflow?.typographyDrafts.slice(0, 6).map((draft) => `${draft.name}: ${draft.layoutType}`) ?? []}
        />
        <SectionHeader title="5方向に整理" description="高品質SVGへ進める前の代表方向です。" />
        <DirectionList directions={exploreResult?.directions ?? []} onLoadDemo={startDemoFlow} />
      </section>

      <section className="panel explore-previews">
        <SectionHeader title="A3 5案高品質SVG" description="Figmaキャンバス上に実物として配置する5案です。各案は比較しやすいよう方向性を変えています。" />
        <div className="preview-list">
          {svgCandidates.map((candidate) => (
            <SvgPreviewCard key={candidate.id} candidate={candidate} direction={directionsById.get(candidate.directionId)} onInsert={handleInsert} />
          ))}
          {svgCandidates.length === 0 && (
            <EmptyState title="高品質SVGはまだありません" body="通常は数秒でDemo候補が自動表示されます。表示されない場合は再読み込みできます。" actionLabel="Demoフローを再読み込み" onAction={startDemoFlow} />
          )}
        </div>
      </section>
    </div>
  );
}

function StageSummary({ count, label, emptyText, samples }: { count: number; label: string; emptyText: string; samples: string[] }) {
  if (count === 0) {
    return <EmptyState title={`${label} はまだありません`} body={emptyText} />;
  }
  return (
    <div className="result-card">
      <div className="result-card-header">
        <strong>{count}件</strong>
        <span>{label}</span>
      </div>
      <ul className="compact-list">
        {samples.map((sample) => (
          <li key={sample}>{sample}</li>
        ))}
      </ul>
    </div>
  );
}

function getExploreTimeline(isRunning: boolean, hasWorkflow: boolean, hasError: boolean): ProcessTimelineStep[] {
  return [
    { label: "30案探索", description: "コピーと訴求軸を広げる", status: hasError ? "error" : hasWorkflow || isRunning ? "completed" : "pending" },
    { label: "15文字組み", description: "情報配置をSVGで比較", status: hasError ? "error" : hasWorkflow ? "completed" : isRunning ? "running" : "pending" },
    { label: "5高品質SVG", description: "比較できる5案へ仕上げ", status: hasWorkflow ? "completed" : isRunning ? "running" : "pending" },
    { label: "Figma記録", description: "実物案とプロセスボードを配置", status: hasWorkflow ? "completed" : isRunning ? "running" : "pending" },
  ];
}

function validateInput(inputMode: InputMode, briefText: string, fixedCopy: FixedCopyInput, contentType: ContentType): string | null {
  if (inputMode === "brief_text" && briefText.trim().length === 0) return "要件を入力してください。";
  if (inputMode === "fixed_copy") {
    if (fixedCopy.main.trim().length === 0) return "メインコピーを入力してください。";
    if (fixedCopy.sub.trim().length === 0) return "サブコピーを入力してください。";
    if (contentType === "seminar_banner" && (fixedCopy.cta ?? "").trim().length === 0) return "セミナーバナーではCTAを入力してください。";
  }
  return null;
}
