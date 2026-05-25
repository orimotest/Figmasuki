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
import { DemoDataButton } from "../components/DemoDataButton";
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
  note_thumbnail: "AI時代にデザイナーが持つべき思考と、これからの制作フローについての記事サムネイル",
  seminar_banner:
    "オンラインセミナー集客用のバナー。時間のないビジネスパーソンに向けて、短時間で学べる価値を伝えたい。信頼感と親しみやすさを両立したい。",
} satisfies Record<ContentType, string>;

const defaultFixedCopy: FixedCopyInput = {
  main: "AI時代、\nデザイナーは何を持つべきか",
  sub: "制作から判断へ。これからの働き方を考える",
  cta: "無料で参加する",
};

const demoFlowBrief = sampleBriefs.seminar_banner;

export function ExploreScreen({ providers, projectData, onProjectData }: ExploreScreenProps) {
  const [contentType, setContentType] = useState<ContentType>("seminar_banner");
  const [inputMode, setInputMode] = useState<InputMode>("brief_text");
  const [briefText, setBriefText] = useState(demoFlowBrief);
  const [fixedCopy, setFixedCopy] = useState<FixedCopyInput>(defaultFixedCopy);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLogs, setStatusLogs] = useState<string[]>(["Demoサンプルを読み込んでいます。APIなしで一連の流れを確認できます。"]);
  const [exploreResult, setExploreResult] = useState<ExploreResult | null>(null);
  const [svgCandidates, setSvgCandidates] = useState<SvgCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const didAutoLoadDemo = useRef(false);

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
    if (didAutoLoadDemo.current) return;
    didAutoLoadDemo.current = true;
    void loadDemoSample("seminar_banner", { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const directionsById = useMemo(() => {
    const map = new Map<string, Direction>();
    exploreResult?.directions.forEach((direction) => map.set(direction.id, direction));
    return map;
  }, [exploreResult]);

  const canShowCta = contentType === "seminar_banner";

  function loadDemo(type: ContentType) {
    void loadDemoSample(type);
  }

  function startDemoFlow() {
    void loadDemoSample("seminar_banner");
  }

  async function loadDemoSample(type: ContentType, options?: { silent?: boolean }) {
    setContentType(type);
    setInputMode("brief_text");
    setBriefText(sampleBriefs[type]);
    setError(null);
    setSuccess(null);
    setIsGenerating(true);
    setStatusLogs([
      "Demoサンプルを読み込んでいます。",
      "コピー方向性5件とSVG候補5件を用意します。",
      "API未設定でもDemo Modeで確認できます。",
    ]);

    try {
      const result = await runExploreWorkflow({
        contentType: type,
        inputMode: "brief_text",
        briefText: sampleBriefs[type],
        rawInput: sampleBriefs[type],
        targetAudience: type === "seminar_banner" ? "忙しいビジネスパーソン" : "デザイナー、編集者、個人クリエイター",
      });
      const svgResult = await runGenerateSvgWorkflow(result);
      setExploreResult(result);
      setSvgCandidates(svgResult.svgs);
      onProjectData(buildProjectData({ exploreResult: result, svgCandidates: svgResult.svgs }));
      setStatusLogs((entries) => [...entries, "Demoサンプルの読み込みが完了しました。", "Figmaへ配置、またはプロセスボードを作成できます。"]);
      if (!options?.silent) setSuccess("Demoサンプルを読み込みました。");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Demoサンプルの読み込みに失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleGenerate() {
    setError(null);
    setSuccess(null);
    const validationMessage = validateInput(inputMode, briefText, fixedCopy, contentType);
    if (validationMessage) {
      setError(validationMessage);
      setStatusLogs((entries) => [...entries, validationMessage]);
      return;
    }

    setIsGenerating(true);
    setExploreResult(null);
    setSvgCandidates([]);
    onProjectData(null);
    setStatusLogs(["入力内容を整理しています。", "30案のコピー方向性を探索しています。"]);

    try {
      const result = await runExploreWorkflow({
        contentType,
        inputMode,
        briefText: inputMode === "brief_text" ? briefText : undefined,
        fixedCopy: inputMode === "fixed_copy" ? fixedCopy : undefined,
        rawInput: inputMode === "brief_text" ? briefText : `${fixedCopy.main}\n${fixedCopy.sub}\n${fixedCopy.cta ?? ""}`,
        targetAudience: contentType === "seminar_banner" ? "忙しいビジネスパーソン" : "デザイナー、編集者、個人クリエイター",
      });
      if (result.providerMeta?.fallbackUsed) {
        setStatusLogs((entries) => [
          ...entries,
          "APIが未設定、またはlive providerに接続できないためDemo Modeに切り替えました。",
          result.providerMeta?.fallbackReason ?? "サンプルデータを使って探索しています。",
        ]);
      } else if (result.providerMeta?.provider === "demo") {
        setStatusLogs((entries) => [...entries, "Demo Modeでサンプル方向性を表示しています。"]);
      }

      setStatusLogs((entries) => [...entries, `${result.exploredCount}案を探索しました。`, `${result.selectedCount}方向に整理しました。`, "SVGレイアウトを生成しています。"]);
      const svgResult = await runGenerateSvgWorkflow(result);
      const fallbackSvg = svgResult.svgs.find((candidate) => candidate.meta.fallbackUsed);
      if (fallbackSvg) {
        setStatusLogs((entries) => [
          ...entries,
          "Gemini API keyが未設定、または生成に失敗したためDemo SVGを表示しています。",
          fallbackSvg.meta.fallbackReason ?? "Demo SVGに切り替えました。",
        ]);
      }
      setExploreResult(result);
      setSvgCandidates(svgResult.svgs);
      onProjectData(buildProjectData({ exploreResult: result, svgCandidates: svgResult.svgs }));
      setStatusLogs((entries) => [...entries, "SVG候補の生成が完了しました。", "Figmaへ配置またはプロセスボード化できます。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "探索に失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleInsert(candidate: SvgCandidate) {
    if (!candidate.validation.valid) {
      setError(`SVG確認に失敗しました: ${candidate.validation.errors.join(" ")}`);
      return;
    }
    postToPlugin({ type: "INSERT_SVG", payload: { svg: candidate.svg, name: candidate.name } });
  }

  function handleInsertAll() {
    const validItems = svgCandidates.filter((candidate) => candidate.validation.valid).map((candidate) => ({ svg: candidate.svg, name: candidate.name }));
    if (validItems.length === 0) {
      setError("先にDemoサンプルを読み込むか、探索を開始してください。配置できるSVG候補がありません。");
      return;
    }
    postToPlugin({ type: "INSERT_SVG_BATCH", payload: { items: validItems } });
  }

  function handleRenderBoard() {
    if (!projectData) {
      setError("先にDemoサンプルを読み込むか、探索を開始してください。コピー方向性とSVG候補が揃うとプロセスボードを作成できます。");
      return;
    }
    postToPlugin({ type: "RENDER_PROCESS_BOARD", payload: projectData });
  }

  function handleReset() {
    setExploreResult(null);
    setSvgCandidates([]);
    onProjectData(null);
    setError(null);
    setSuccess(null);
    setStatusLogs(["結果をリセットしました。Demoサンプルを読み込むか、要件を入力して探索を開始してください。"]);
  }

  return (
    <div className="explore-layout">
      <section className="panel explore-controls">
        <SectionHeader
          title="探索の入力"
          description="要件からコピー方向性5件とSVG候補5件を整理します。Demo ModeではAPIなしで確認できます。"
          aside={<ProviderBadge label="SVG" provider={providers.svg} />}
        />
        <div className="badge-row">
          <CanvasBadge />
          <span className="provider-badge warning">実行モード: Demo Mode対応</span>
          {exploreResult && <span className="provider-badge">30案から5方向</span>}
        </div>
        <UsageGuide note="API未設定でもDemo Modeにfallbackし、探索、配置、診断、比較、仕上げまで確認できます。" />
        <ProcessTimeline steps={getExploreTimeline(isGenerating, Boolean(exploreResult), Boolean(error))} />
        {isGenerating && <LoadingState title="方向性を探索しています" description="コピー、訴求軸、レイアウト方針、SVG候補を整理しています。" />}

        <div className="demo-actions">
          <button className="primary-button" type="button" onClick={startDemoFlow} disabled={isGenerating}>
            Demoサンプルを読み込む
          </button>
          <DemoDataButton type="note_thumbnail" onClick={loadDemo} />
          <DemoDataButton type="seminar_banner" onClick={loadDemo} />
        </div>

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

        {error && <ErrorMessage title="探索を実行できませんでした" detail={error} action="Demoサンプルを読み込むか、入力内容を確認してもう一度実行してください。" />}
        {success && <SuccessMessage title={success} detail="Figma上で編集可能なノードやプロセスボードとして確認できます。" />}

        <ActionBar>
          <button className="primary-button" type="button" disabled={isGenerating} onClick={handleGenerate}>
            {isGenerating ? "探索中..." : "探索を開始"}
          </button>
          <button className="secondary-button" type="button" disabled={isGenerating} onClick={handleInsertAll}>
            5案をまとめてFigmaに配置
          </button>
          <button className="secondary-button" type="button" disabled={isGenerating} onClick={handleRenderBoard}>
            プロセスボードをFigmaに作成
          </button>
          <button className="ghost-button" type="button" onClick={handleReset}>
            結果をリセット
          </button>
        </ActionBar>
        <StatusLog entries={statusLogs} />
      </section>

      <section className="panel explore-results">
        <SectionHeader title="コピー方向性" description="30案から抽出した5方向です。意図、懸念、向いている用途まで確認できます。" />
        <DirectionList directions={exploreResult?.directions ?? []} onLoadDemo={startDemoFlow} />
      </section>

      <section className="panel explore-previews">
        <SectionHeader title="SVG候補" description="Figmaに配置できる800x450のSVG候補です。方向性ごとに見た目の差を持たせています。" />
        <div className="preview-list">
          {svgCandidates.map((candidate) => (
            <SvgPreviewCard key={candidate.id} candidate={candidate} direction={directionsById.get(candidate.directionId)} onInsert={handleInsert} />
          ))}
          {svgCandidates.length === 0 && (
            <EmptyState
              title="候補案はまだありません"
              body="Demoサンプルを読み込むと、5つのSVG候補を確認できます。または要件を入力して探索を開始してください。"
              actionLabel="Demoサンプルを読み込む"
              onAction={startDemoFlow}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function getExploreTimeline(isRunning: boolean, hasResult: boolean, hasError: boolean): ProcessTimelineStep[] {
  return [
    { label: "入力内容を確認", description: "用途と入力タイプを整理", status: hasError ? "error" : hasResult || isRunning ? "completed" : "pending" },
    { label: "30案を探索", description: "コピーと訴求軸を広げる", status: hasError ? "error" : hasResult ? "completed" : isRunning ? "running" : "pending" },
    { label: "5方向に整理", description: "代表的な方向性を抽出", status: hasResult ? "completed" : isRunning ? "running" : "pending" },
    { label: "SVG候補を生成", description: "Figmaに置ける候補案を作成", status: hasResult ? "completed" : isRunning ? "running" : "pending" },
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
