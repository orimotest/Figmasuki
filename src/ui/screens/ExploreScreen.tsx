import { useEffect, useState } from "react";
import type { ContentType } from "../../schemas/content";
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
import { ErrorMessage } from "../components/ErrorMessage";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { PresetSelector } from "../components/PresetSelector";
import { ProductionTimeline, type ProductionTimelineItem } from "../components/ProductionTimeline";
import { ProviderBadge } from "../components/ProviderBadge";
import { SectionHeader } from "../components/SectionHeader";
import { StatusLog } from "../components/StatusLog";
import { SuccessMessage } from "../components/SuccessMessage";
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
  const [targetAudience, setTargetAudience] = useState("忙しいビジネスパーソン");
  const [appealPoint, setAppealPoint] = useState("60分で学べる / 明日から使える");
  const [toneValue, setToneValue] = useState("信頼感 + 親しみやすさ");
  const [ctaText, setCtaText] = useState(defaultFixedCopy.cta ?? "無料で参加する");
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

  useEffect(() => {
    const handleHeaderStart = () => {
      if (!isGenerating) void runFullAutoProduction();
    };
    window.addEventListener("START_AUTO_PRODUCTION", handleHeaderStart);
    return () => window.removeEventListener("START_AUTO_PRODUCTION", handleHeaderStart);
  }, [isGenerating, contentType, inputMode, briefText, fixedCopy, targetAudience, appealPoint, toneValue, ctaText]);

  const workflow = projectData?.stageWorkflow;
  const visibleSvgCandidates = svgCandidates.length ? svgCandidates : projectData?.svgCandidates ?? [];
  const primaryCandidate =
    visibleSvgCandidates.find((candidate) => candidate.id === projectData?.comparisonResult?.recommendation.primaryFrameId) ?? visibleSvgCandidates[0];

  function startDemoFlow() {
    void runDemoSample("seminar_banner");
  }

  async function runDemoSample(type: ContentType, options?: { silent?: boolean }) {
    setContentType(type);
    setInputMode("brief_text");
    setBriefText(sampleBriefs[type]);
    setTargetAudience(type === "seminar_banner" ? "忙しいビジネスパーソン" : "デザイナー / 編集者 / 個人クリエイター");
    setAppealPoint(type === "seminar_banner" ? "60分で学べる / 明日から使える" : "AI時代の制作判断を考える");
    setToneValue(type === "seminar_banner" ? "信頼感 + 親しみやすさ" : "知的 + 静かな編集感");
    setCtaText(type === "seminar_banner" ? "無料で参加する" : "");
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
        targetAudience: type === "seminar_banner" ? "忙しいビジネスパーソン" : "デザイナー / 編集者 / 個人クリエイター",
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
        fixedCopy: inputMode === "fixed_copy" ? { ...fixedCopy, cta: ctaText } : undefined,
        rawInput:
          inputMode === "brief_text"
            ? `${briefText}\nターゲット: ${targetAudience}\n訴求ポイント: ${appealPoint}\nトーン: ${toneValue}\nCTA: ${ctaText}`
            : `${fixedCopy.main}\n${fixedCopy.sub}\n${ctaText}`,
        targetAudience,
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

  function handleReset() {
    setExploreResult(null);
    setSvgCandidates([]);
    onProjectData(null);
    setError(null);
    setSuccess(null);
    setProductionStage("input_ready");
    setFigmaOutputs([]);
    setContentType("seminar_banner");
    setInputMode("brief_text");
    setBriefText(sampleBriefs.seminar_banner);
    setTargetAudience("忙しいビジネスパーソン");
    setAppealPoint("60分で学べる / 明日から使える");
    setToneValue("信頼感 + 親しみやすさ");
    setCtaText(defaultFixedCopy.cta ?? "無料で参加する");
    setStatusLogs(["結果をリセットしました。もう一度Demoフローを読み込むか、要件を入力してください。"]);
  }

  return (
    <div className="explore-layout auto-production-grid">
      <section className="panel requirement-panel">
        <SectionHeader title="要件入力" description="制作ジョブの起点です。入力後は自動制作が最終候補まで進みます。" />
        <div className="requirement-form">
          <PresetSelector value={contentType} onChange={setContentType} />
          <label className="field full-width">
            <span>内容</span>
            <textarea value={briefText} onChange={(event) => setBriefText(event.target.value)} placeholder={sampleBriefs[contentType]} />
          </label>
          <label className="field">
            <span>ターゲット</span>
            <input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} />
          </label>
          <label className="field">
            <span>訴求ポイント</span>
            <input value={appealPoint} onChange={(event) => setAppealPoint(event.target.value)} />
          </label>
          <label className="field">
            <span>トーン</span>
            <input value={toneValue} onChange={(event) => setToneValue(event.target.value)} />
          </label>
          <label className="field">
            <span>CTA</span>
            <input value={ctaText} onChange={(event) => setCtaText(event.target.value)} placeholder="無料で参加する" />
          </label>
        </div>
        <UsageGuide note="AIが入力内容をもとに、探索 → 文字組み → 高品質SVG → 比較 → 背景生成まで自動で進行します。" />
        <ActionBar>
          <button className="primary-button" type="button" disabled={isGenerating} onClick={runFullAutoProduction}>
            {isGenerating ? "制作中..." : productionStage === "completed" ? "再実行" : "自動制作を開始"}
          </button>
          <button className="secondary-button" type="button" disabled={isGenerating} onClick={startDemoFlow}>
            Demoデータを読み込む
          </button>
          <button className="ghost-button" type="button" onClick={handleReset}>
            リセット
          </button>
        </ActionBar>
      </section>

      <section className="panel production-panel">
        <SectionHeader
          title="段階型Explore / 自動制作フロー"
          description="タブを順番に押すのではなく、制作ジョブとしてFinal Candidateまで進行します。"
          aside={<ProviderBadge label="SVG" provider={providers.svg} />}
        />
        <div className="badge-row">
          <CanvasBadge />
          <span className="provider-badge warning">実行モード: Demo</span>
          <ProviderBadge label="provider" provider={providers.copy} />
          <span className="provider-badge">現在: {getProductionStageLabel(productionStage)}</span>
        </div>
        <ProductionTimeline currentStage={productionStage} items={productionTimelineItems} />
        {isGenerating && <LoadingState title={getProductionStageLabel(productionStage)} description={getProductionStageMessage(productionStage)} />}
        {error && <ErrorMessage title="自動制作を実行できませんでした" detail={error} action="API未設定時はDemo Modeで再実行できます。入力内容を確認してください。" />}
        {productionStage === "completed" && (
          <SuccessMessage
            title="制作プロセスが完了しました"
            detail="30案探索、15案文字組みドラフト、5案高品質SVG、比較結果、背景3案、最終候補をFigmaに記録しました。"
          />
        )}
        {success && productionStage !== "completed" && <SuccessMessage title={success} detail="Figma上で工程ごとの記録ボードを確認できます。" />}
        <div className="production-bottom-grid">
          <div className="result-card compact-card">
            <div className="result-card-header">
              <strong>処理ログ</strong>
              <span>{statusLogs.length}件</span>
            </div>
            <StatusLog entries={statusLogs.slice(-5)} />
          </div>
          <FigmaOutputStatus outputs={figmaOutputs} />
        </div>
      </section>

      <section className="panel current-results-panel">
        <SectionHeader title="現在の成果" description="自動制作が進むほど、右側に成果が積み上がります。" />
        <IdeaSummaryCard count={workflow?.ideaDirections.length ?? 0} />
        <PreviewShelf
          title="15案文字組みドラフト"
          count={workflow?.typographyDrafts.length ?? 0}
          items={workflow?.typographyDrafts.slice(0, 5).map((draft) => ({ id: draft.id, name: draft.name, svg: draft.svg })) ?? []}
          emptyTitle="Typography Draftを生成中"
        />
        <PreviewShelf
          title="5案高品質SVG"
          count={visibleSvgCandidates.length}
          items={visibleSvgCandidates.slice(0, 3).map((candidate) => ({ id: candidate.id, name: candidate.name, svg: candidate.svg }))}
          emptyTitle="高品質SVGを生成中"
        />
        <FinalCandidatePreview candidate={primaryCandidate} completed={productionStage === "completed"} />
      </section>
    </div>
  );
}

function FigmaOutputStatus({ outputs }: { outputs: FigmaOutputRecord[] }) {
  const stages: ProcessBoardStage[] = ["project_header", "ideas", "typography_drafts", "refined_svgs", "compare", "background_variations", "final_candidate"];
  return (
    <div className="result-card compact-card">
      <div className="result-card-header">
        <strong>Figmaへの記録</strong>
        <span>{outputs.length}/7</span>
      </div>
      <ul className="figma-output-list">
        {stages.map((stage) => {
          const output = outputs.find((item) => item.stage === stage);
          return (
            <li key={stage} className={output ? "placed" : "pending"}>
              <span>{getProcessBoardLabel(stage)}</span>
              <em>{output ? "記録済み" : "待機"}</em>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IdeaSummaryCard({ count }: { count: number }) {
  const rows = [
    ["AI活用のメリット訴求", 12],
    ["時間価値（60分で学べる）", 8],
    ["明日から使える実用性", 6],
    ["信頼感・専門性の表現", 4],
  ];
  return (
    <div className="result-card summary-card">
      <div className="result-card-header">
        <strong>30案探索サマリー</strong>
        <span>{count || 30}案</span>
      </div>
      <ul className="summary-breakdown">
        {rows.map(([label, value]) => (
          <li key={label}>
            <span># {label}</span>
            <strong>{value}案</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PreviewShelf({ title, count, items, emptyTitle }: { title: string; count: number; items: { id: string; name: string; svg: string }[]; emptyTitle: string }) {
  return (
    <div className="result-card preview-shelf">
      <div className="result-card-header">
        <strong>{title}</strong>
        <span>{count ? `${count}件` : "待機"}</span>
      </div>
      {items.length > 0 ? (
        <div className="mini-preview-row">
          {items.map((item) => (
            <MiniSvgPreview key={item.id} svg={item.svg} label={item.name} />
          ))}
          {count > items.length && <span className="more-count">+{count - items.length}</span>}
        </div>
      ) : (
        <EmptyState title={emptyTitle} body="自動制作を開始すると、この欄にサムネイルが表示されます。" />
      )}
    </div>
  );
}

function FinalCandidatePreview({ candidate, completed }: { candidate?: SvgCandidate; completed: boolean }) {
  return (
    <div className="result-card final-preview-card">
      <div className="result-card-header">
        <strong>最終候補</strong>
        <span>{completed ? "Primary候補" : "生成中"}</span>
      </div>
      {candidate ? (
        <>
          <MiniSvgPreview svg={candidate.svg} label={candidate.name} large />
          <p>比較結果で選ばれたPrimary案をベースに、背景3案とFinal CandidateをFigmaに記録します。</p>
        </>
      ) : (
        <EmptyState title="Final Candidateを生成中" body="5案比較と背景生成が完了すると、ここに最終候補が表示されます。" />
      )}
    </div>
  );
}

function MiniSvgPreview({ svg, label, large = false }: { svg: string; label: string; large?: boolean }) {
  return (
    <figure className={large ? "mini-svg-preview large" : "mini-svg-preview"}>
      <div className="mini-svg-canvas" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>{label}</figcaption>
    </figure>
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
