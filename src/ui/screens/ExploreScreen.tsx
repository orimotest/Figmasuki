import { useEffect, useMemo, useState } from "react";
import type { ContentType } from "../../schemas/content";
import type { Direction } from "../../schemas/direction";
import type { FixedCopyInput, InputMode } from "../../schemas/input";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import type { FigmaOutputRecord, ProcessBoardStage, ProductionStage } from "../../schemas/production";
import type { ExploreResult, SvgCandidate } from "../../schemas/svg";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { runCompareWorkflow } from "../../workflows/compareWorkflow";
import { runExploreWorkflow } from "../../workflows/exploreWorkflow";
import { runFinishWorkflow } from "../../workflows/finishWorkflow";
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
import { ProductionTimeline, type ProductionTimelineItem } from "../components/ProductionTimeline";
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
  const [statusLogs, setStatusLogs] = useState<string[]>(["要件を確認して、主ボタンを押すと自動で制作フローを開始します。"]);
  const [exploreResult, setExploreResult] = useState<ExploreResult | null>(null);
  const [svgCandidates, setSvgCandidates] = useState<SvgCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [productionStage, setProductionStage] = useState<ProductionStage>("input_ready");
  const [figmaOutputs, setFigmaOutputs] = useState<FigmaOutputRecord[]>([]);

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
    setProductionStage("exploring_ideas");
    setStatusLogs(["Demoフローを読み込んでいます。", "30案探索、15文字組みドラフト、5高品質SVGを準備しています。"]);

    try {
      await wait(350);
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
      setProductionStage("input_ready");
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

  async function runFullAutoProduction() {
    setError(null);
    setSuccess(null);
    setFigmaOutputs([]);
    const validationMessage = validateInput(inputMode, briefText, fixedCopy, contentType);
    if (validationMessage) {
      setError(validationMessage);
      setStatusLogs((entries) => [...entries, validationMessage]);
      return;
    }

    setIsGenerating(true);
    const startedAt = new Date().toISOString();
    setProductionStage("exploring_ideas");
    setStatusLogs(["自動制作ジョブを開始しました。", "AIがコピーと訴求軸を広げています。"]);

    try {
      await wait(500);
      const exploreResult = await runExploreWorkflow({
        contentType,
        inputMode,
        briefText: inputMode === "brief_text" ? briefText : undefined,
        fixedCopy: inputMode === "fixed_copy" ? fixedCopy : undefined,
        rawInput: inputMode === "brief_text" ? briefText : `${fixedCopy.main}\n${fixedCopy.sub}\n${fixedCopy.cta ?? ""}`,
        targetAudience: contentType === "seminar_banner" ? "忙しいビジネスパーソン" : "デザイナー、編集者、個人クリエイター",
      });
      setExploreResult(exploreResult);
      setStatusLogs((entries) => [...entries, `${exploreResult.exploredCount}案を探索しました。`]);

      let project = buildProjectData({
        exploreResult,
        svgCandidates: [],
        productionStatus: { stage: "placing_ideas_board", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas"]),
      });
      onProjectData(project);
      setProductionStage("placing_ideas_board");
      postStageBoard(project, "project_header");
      await wait(450);
      postStageBoard(project, "ideas");
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("generating_typography_drafts");
      setStatusLogs((entries) => [...entries, "30案を整理し、文字組みドラフトに進める15案を選んでいます。"]);
      await wait(650);
      setProductionStage("placing_typography_board");
      project = {
        ...project,
        productionStatus: { stage: "placing_typography_board", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas", "typography_drafts"]),
      };
      onProjectData(project);
      postStageBoard(project, "typography_drafts");
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("selecting_refined_candidates");
      setStatusLogs((entries) => [...entries, "15案から比較しやすい5案を選んでいます。"]);
      await wait(450);
      setProductionStage("generating_refined_svgs");
      setStatusLogs((entries) => [...entries, "Gemini想定の工程として、5案を高品質SVGに整えています。"]);
      const svgResult = await runGenerateSvgWorkflow(exploreResult);
      setSvgCandidates(svgResult.svgs);
      project = buildProjectData({
        exploreResult,
        svgCandidates: svgResult.svgs,
        productionStatus: { stage: "placing_refined_board", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas", "typography_drafts", "refined_svgs"]),
      });
      onProjectData(project);
      await wait(650);
      setProductionStage("placing_refined_board");
      postStageBoard(project, "refined_svgs");
      postToPlugin({ type: "INSERT_SVG_BATCH", payload: { items: svgResult.svgs.map((candidate) => ({ svg: candidate.svg, name: candidate.name })) } });
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("running_auto_compare");
      setStatusLogs((entries) => [...entries, "5案を自動比較し、ベース候補と次点候補を整理しています。"]);
      const autoFrames = createAutoCompareFrames(project);
      const comparisonResult = await runCompareWorkflow(autoFrames, project.contentType);
      project = buildProjectData({
        exploreResult,
        svgCandidates: svgResult.svgs,
        comparisonResult,
        productionStatus: { stage: "placing_compare_board", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas", "typography_drafts", "refined_svgs", "compare"]),
      });
      onProjectData(project);
      await wait(550);
      setProductionStage("placing_compare_board");
      postStageBoard(project, "compare");
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("generating_backgrounds");
      setStatusLogs((entries) => [...entries, "Primary案に合わせて背景3案を生成しています。"]);
      const backgroundResult = await runFinishWorkflow(comparisonResult.backgroundBrief);
      project = buildProjectData({
        exploreResult,
        svgCandidates: svgResult.svgs,
        comparisonResult,
        backgroundResult,
        productionStatus: { stage: "placing_background_board", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas", "typography_drafts", "refined_svgs", "compare", "background_variations"]),
      });
      onProjectData(project);
      await wait(550);
      setProductionStage("placing_background_board");
      postStageBoard(project, "background_variations");
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("placing_final_candidate");
      project = {
        ...project,
        productionStatus: { stage: "placing_final_candidate", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas", "typography_drafts", "refined_svgs", "compare", "background_variations", "final_candidate"]),
      };
      onProjectData(project);
      await wait(450);
      postStageBoard(project, "final_candidate");
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("completed");
      onProjectData({ ...project, productionStatus: { stage: "completed", startedAt, completedAt: new Date().toISOString() } });
      setSuccess("制作プロセスが完了しました。");
      setStatusLogs((entries) => [...entries, "30案、15案、5案、比較結果、背景3案、最終候補をFigmaに記録しました。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "生成と配置に失敗しました。";
      setError(message);
      setProductionStage("error");
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

    setStatusLogs((entries) => [...entries, `${result.exploredCount}案を探索しました。`]);
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
    setProductionStage("input_ready");
    setFigmaOutputs([]);
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
          <span className="provider-badge">現在: {getProductionStageLabel(productionStage)}</span>
        </div>
        <UsageGuide note="主ボタン1つで自動制作ジョブを開始し、30案探索、15案文字組み、5案SVG、比較、背景3案、最終候補まで順番に進みます。各工程の結果はFigmaに記録されます。" />
        <ProductionTimeline currentStage={productionStage} items={productionTimelineItems} />
        {isGenerating && <LoadingState title={getProductionStageLabel(productionStage)} description={getProductionStageMessage(productionStage)} />}
        {productionStage === "completed" && (
          <SuccessMessage title="制作プロセスが完了しました" detail="30案探索、15案文字組みドラフト、5案高品質SVG、比較結果、背景3案、最終候補をFigmaに記録しました。" />
        )}
        {figmaOutputs.length > 0 && (
          <div className="result-card">
            <div className="result-card-header">
              <strong>Figmaへの記録</strong>
              <span>{figmaOutputs.length}工程</span>
            </div>
            <ul className="compact-list">
              {figmaOutputs.map((output) => (
                <li key={`${output.stage}-${output.placedAt}`}>{getProcessBoardLabel(output.stage)} を記録済み</li>
              ))}
            </ul>
          </div>
        )}

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
          <button className="primary-button" type="button" disabled={isGenerating} onClick={runFullAutoProduction}>
            {isGenerating ? "制作中..." : productionStage === "completed" ? "最初からやり直す" : "自動制作を開始"}
          </button>
          <button className="secondary-button" type="button" disabled={isGenerating} onClick={startDemoFlow}>
            Demoデータだけ準備
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

const productionTimelineItems: ProductionTimelineItem[] = [
  { stage: "input_ready", title: "要件を確認", description: "入力内容と用途を確認します。" },
  { stage: "exploring_ideas", title: "30案を探索", description: "コピー、訴求軸、トーンを広げます。" },
  { stage: "placing_ideas_board", title: "30案探索ボードを記録", description: "探索結果をFigmaに記録します。", figmaStage: true },
  { stage: "generating_typography_drafts", title: "15案の文字組みを生成", description: "余白、CTA位置、情報優先順位を検討します。" },
  { stage: "placing_typography_board", title: "15案ドラフトを記録", description: "文字組みドラフトをFigmaに記録します。", figmaStage: true },
  { stage: "selecting_refined_candidates", title: "5案を選定", description: "比較しやすい方向性へ絞ります。" },
  { stage: "generating_refined_svgs", title: "5案を高品質SVG化", description: "実バナーとして見られるSVGに整えます。" },
  { stage: "placing_refined_board", title: "5案SVGを記録", description: "5案ボードと実SVGをFigmaに配置します。", figmaStage: true },
  { stage: "running_auto_compare", title: "5案を比較", description: "AIがPrimary / Secondary候補を整理します。" },
  { stage: "placing_compare_board", title: "比較結果を記録", description: "比較表とbackground briefをFigmaに記録します。", figmaStage: true },
  { stage: "generating_backgrounds", title: "背景3案を生成", description: "Primary案に合わせた背景方向を作ります。" },
  { stage: "placing_background_board", title: "背景案を記録", description: "背景3案をFigmaに記録します。", figmaStage: true },
  { stage: "placing_final_candidate", title: "最終候補を記録", description: "Final CandidateをFigmaに記録します。", figmaStage: true },
  { stage: "completed", title: "制作完了", description: "自動制作ジョブが完了しました。" },
];

function getProductionStageLabel(stage: ProductionStage): string {
  const labels: Record<ProductionStage, string> = {
    idle: "待機中",
    input_ready: "要件確認",
    exploring_ideas: "30案探索",
    placing_ideas_board: "30案をFigmaに記録",
    generating_typography_drafts: "15案文字組み生成",
    placing_typography_board: "15案をFigmaに記録",
    selecting_refined_candidates: "5案選定",
    generating_refined_svgs: "5案SVG化",
    placing_refined_board: "5案をFigmaに記録",
    running_auto_compare: "5案比較",
    placing_compare_board: "比較結果をFigmaに記録",
    generating_backgrounds: "背景3案生成",
    placing_background_board: "背景案をFigmaに記録",
    placing_final_candidate: "最終候補をFigmaに記録",
    completed: "制作完了",
    error: "エラー",
  };
  return labels[stage];
}

function getProductionStageMessage(stage: ProductionStage): string {
  const item = productionTimelineItems.find((entry) => entry.stage === stage);
  return item?.description ?? "制作ジョブを進めています。";
}

function getProcessBoardLabel(stage: ProcessBoardStage): string {
  const labels: Record<ProcessBoardStage, string> = {
    project_header: "Project Header",
    ideas: "30 Ideas Explore",
    typography_drafts: "15 Typography Drafts",
    refined_svgs: "5 Refined SVGs",
    diagnosis: "Diagnosis",
    compare: "Compare Result",
    background_variations: "Background Variations",
    final_candidate: "Final Candidate",
  };
  return labels[stage];
}

function createOutputRecords(stages: ProcessBoardStage[]): FigmaOutputRecord[] {
  return stages.map((stage) => ({ stage, placedAt: new Date().toISOString(), status: "placed" }));
}

function postStageBoard(project: ProjectData, stage: ProcessBoardStage) {
  postToPlugin({ type: "RENDER_PROCESS_STAGE_BOARD", payload: { project, stage, zoom: false } });
}

function createAutoCompareFrames(project: ProjectData): FigmaFrameData[] {
  return project.svgCandidates.map((candidate, index) => {
    const direction = project.copyDirections.find((item) => item.id === candidate.directionId);
    const main = direction?.copy.main ?? candidate.name;
    const sub = direction?.copy.sub ?? direction?.summary ?? "比較用の自動生成候補";
    const cta = direction?.copy.cta ?? "無料で参加する";
    const textNodes = [
      createTextNode(`auto_${candidate.id}_main`, "Main Copy", main, 56, 112, 520, 96, 56),
      createTextNode(`auto_${candidate.id}_sub`, "Sub Copy", sub, 56, 250, 520, 40, 22),
      createTextNode(`auto_${candidate.id}_date`, "Date", "6.18 WED 14:00", 56, 334, 180, 28, 16),
      createTextNode(`auto_${candidate.id}_cta`, "CTA", cta, 560, 354, 180, 42, 18),
    ];
    return {
      id: candidate.id,
      name: candidate.name,
      x: index * 900,
      y: 0,
      width: 800,
      height: 450,
      textNodes,
      shapeNodes: [],
      derived: {
        textCount: textNodes.length,
        shapeCount: 0,
        totalTextChars: textNodes.reduce((total, node) => total + node.characters.length, 0),
        maxFontSize: 56,
        minFontSize: 16,
        colors: [],
        colorCount: 0,
        elementDensity: 0.02,
        frameSizeMatchesCanvas: true,
        possibleMainTitle: textNodes[0],
        possibleCTA: textNodes[3],
        possibleDate: textNodes[2],
        safeAreaIssues: [],
      },
    };
  });
}

function createTextNode(id: string, name: string, characters: string, x: number, y: number, width: number, height: number, fontSize: number) {
  return {
    id,
    name,
    characters,
    x,
    y,
    width,
    height,
    fontSize,
    fontName: "Inter Bold",
    fontFamily: "Inter",
    fills: [],
    color: null,
    opacity: 1,
    visible: true,
  };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
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
