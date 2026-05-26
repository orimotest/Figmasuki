import { useEffect, useState } from "react";
import type { ContentType } from "../../schemas/content";
import type { FixedCopyInput, InputMode, ExploreInput } from "../../schemas/input";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import type { FigmaOutputRecord, ProcessBoardStage, ProductionStage } from "../../schemas/production";
import type { ExploreResult, SvgCandidate } from "../../schemas/svg";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { getRuntimeExecutionModeLabel, RUNTIME_API_SETTINGS_CHANGED_EVENT } from "../../config/runtimeApiSettings";
import { organizeInputWithDify } from "../../providers/dify/inputOrganizerClient";
import { extractPdfText } from "../../utils/extractPdfText";
import { runCompareWorkflow } from "../../workflows/compareWorkflow";
import { runExploreWorkflow } from "../../workflows/exploreWorkflow";
import { runFinishWorkflow } from "../../workflows/finishWorkflow";
import { runGenerateSvgWorkflow } from "../../workflows/generateSvgWorkflow";
import { normalizeCreativeInput } from "../../workflows/inputNormalizeWorkflow";
import { buildProjectData } from "../projectBuilder";
import { ActionBar } from "../components/ActionBar";
import { CanvasBadge } from "../components/CanvasBadge";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { InputModeSelector } from "../components/InputModeSelector";
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
  note_thumbnail: "AI時代にデザイナーが持つべき思考と、これからの制作フローについての記事サムネイルを作りたい。",
  seminar_banner:
    "オンラインセミナー集客用のバナー。時間のないビジネスパーソンに向けて、短時間で学べる価値を伝えたい。信頼感と親しみやすさを両立したい。",
} satisfies Record<ContentType, string>;

const defaultFixedCopy: FixedCopyInput = {
  main: "60分でわかる\nAI活用の第一歩",
  sub: "業務改善に使える考え方と実践例を紹介",
  cta: "無料で参加する",
  date: "6.18 WED",
  time: "14:00-15:00",
};

export function ExploreScreen({ providers, projectData, onProjectData }: ExploreScreenProps) {
  const [contentType, setContentType] = useState<ContentType>("seminar_banner");
  const [inputMode, setInputMode] = useState<InputMode>("brief_text");
  const [projectName, setProjectName] = useState("オンラインセミナー集客バナー");
  const [briefText, setBriefText] = useState(sampleBriefs.seminar_banner);
  const [fixedCopy, setFixedCopy] = useState<FixedCopyInput>(defaultFixedCopy);
  const [targetAudience, setTargetAudience] = useState("忙しいビジネスパーソン");
  const [appealPoint, setAppealPoint] = useState("60分で学べる / 明日から使える");
  const [toneValue, setToneValue] = useState("信頼感 + 親しみやすさ");
  const [ctaText, setCtaText] = useState(defaultFixedCopy.cta ?? "無料で参加する");
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [pdfStatus, setPdfStatus] = useState("");
  const [referenceFrameSummary, setReferenceFrameSummary] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLogs, setStatusLogs] = useState<string[]>(["要件を入力して、自動制作を開始できます。"]);
  const [exploreResult, setExploreResult] = useState<ExploreResult | null>(null);
  const [svgCandidates, setSvgCandidates] = useState<SvgCandidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [productionStage, setProductionStage] = useState<ProductionStage>("input_ready");
  const [figmaOutputs, setFigmaOutputs] = useState<FigmaOutputRecord[]>([]);
  const [executionMode, setExecutionMode] = useState<"Live" | "Demo">(() => getRuntimeExecutionModeLabel());

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
      if (message.type === "SELECTION_FRAME_RESULT") {
        const summary = summarizeReferenceFrame(message.payload);
        setReferenceFrameSummary(summary);
        setStatusLogs((entries) => [...entries, `参考フレームを取得しました: ${message.payload.name}`]);
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
  }, [isGenerating, contentType, inputMode, briefText, fixedCopy, targetAudience, appealPoint, toneValue, ctaText, pdfText, referenceFrameSummary]);

  useEffect(() => {
    const refreshExecutionMode = () => setExecutionMode(getRuntimeExecutionModeLabel());
    window.addEventListener(RUNTIME_API_SETTINGS_CHANGED_EVENT, refreshExecutionMode);
    return () => window.removeEventListener(RUNTIME_API_SETTINGS_CHANGED_EVENT, refreshExecutionMode);
  }, []);

  const workflow = projectData?.stageWorkflow;
  const visibleSvgCandidates = svgCandidates.length ? svgCandidates : projectData?.svgCandidates ?? [];
  const primaryCandidate =
    visibleSvgCandidates.find((candidate) => candidate.id === projectData?.comparisonResult?.recommendation.primaryFrameId) ?? visibleSvgCandidates[0];

  function loadSample(type: ContentType = "seminar_banner") {
    setContentType(type);
    setInputMode("brief_text");
    setProjectName(type === "seminar_banner" ? "オンラインセミナー集客バナー" : "AI時代のデザイン思考サムネイル");
    setBriefText(sampleBriefs[type]);
    setTargetAudience(type === "seminar_banner" ? "忙しいビジネスパーソン" : "デザイナー、編集者、個人クリエイター");
    setAppealPoint(type === "seminar_banner" ? "60分で学べる / 明日から使える" : "AI時代の制作判断を考える");
    setToneValue(type === "seminar_banner" ? "信頼感 + 親しみやすさ" : "知的 + 静かな編集感");
    setCtaText(type === "seminar_banner" ? "無料で参加する" : "");
    setPdfFileName("");
    setPdfText("");
    setReferenceFrameSummary("");
    setError(null);
    setSuccess("サンプルを読み込みました。自動制作を開始できます。");
    setStatusLogs((entries) => [...entries, "サンプル要件を読み込みました。"]);
  }

  async function handlePdfFile(file: File | undefined) {
    if (!file) return;
    setPdfFileName(file.name);
    setPdfStatus("PDFからテキストを抽出しています。");
    const result = await extractPdfText(file);
    if (result.ok) {
      setPdfText(result.text);
      setBriefText(result.text.slice(0, 1600));
      setPdfStatus("PDFテキストを取得しました。内容を確認して自動制作を開始できます。");
      setStatusLogs((entries) => [...entries, `PDFを読み込みました: ${file.name}`]);
    } else {
      setPdfText("");
      setPdfStatus(result.reason);
      setStatusLogs((entries) => [...entries, result.reason]);
    }
  }

  function requestReferenceFrame() {
    setInputMode("figma_reference");
    postToPlugin({ type: "REQUEST_SELECTED_FRAME" });
  }

  async function runFullAutoProduction() {
    setError(null);
    setSuccess(null);
    setFigmaOutputs([]);
    const rawInput = createExploreInput();
    const validationMessage = validateInput(rawInput);
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
      const normalized = await organizeInputWithDify(rawInput);
      const workflowInput: ExploreInput = {
        ...rawInput,
        projectName: normalized.projectName,
        goal: normalized.goal,
        targetAudience: normalized.target,
        tone: normalized.tone,
        briefText: normalized.briefText ?? rawInput.briefText,
        pdfText: normalized.pdfText,
        referenceFrameSummary: normalized.referenceFrameSummary,
        assumptions: normalized.assumptions,
        rawInput: createRawInputText(normalized),
      };

      await wait(420);
      const result = await runExploreWorkflow(workflowInput);
      setExploreResult(result);
      setStatusLogs((entries) => [...entries, `${result.exploredCount}案を探索しました。`]);

      let project = buildProjectData({
        exploreResult: result,
        svgCandidates: [],
        productionStatus: { stage: "placing_ideas_board", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas"]),
      });
      onProjectData(project);
      setProductionStage("placing_ideas_board");
      postStageBoard(project, "project_header");
      await wait(360);
      postStageBoard(project, "ideas");
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("generating_typography_drafts");
      setStatusLogs((entries) => [...entries, "30案を整理し、文字組みドラフトに進める15案を選んでいます。"]);
      await wait(560);

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
      setStatusLogs((entries) => [...entries, "15案から比較しやすい5案を選定しています。"]);
      await wait(420);

      setProductionStage("generating_refined_svgs");
      setStatusLogs((entries) => [...entries, "5案を高品質SVGに整えています。"]);
      const svgResult = await runGenerateSvgWorkflow(result);
      setSvgCandidates(svgResult.svgs);
      project = buildProjectData({
        exploreResult: result,
        svgCandidates: svgResult.svgs,
        productionStatus: { stage: "placing_refined_board", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas", "typography_drafts", "refined_svgs"]),
      });
      onProjectData(project);
      await wait(520);

      setProductionStage("placing_refined_board");
      postStageBoard(project, "refined_svgs");
      postToPlugin({
        type: "INSERT_SVG_BATCH",
        payload: { items: svgResult.svgs.map((candidate) => ({ svg: candidate.svg, name: candidate.name })), x: 0, y: 980 },
      });
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("running_auto_compare");
      setStatusLogs((entries) => [...entries, "5案を比較し、ベース候補と次点候補を整理しています。"]);
      const autoFrames = createAutoCompareFrames(project);
      const comparisonResult = await runCompareWorkflow(autoFrames, project.contentType);
      project = buildProjectData({
        exploreResult: result,
        svgCandidates: svgResult.svgs,
        comparisonResult,
        productionStatus: { stage: "placing_compare_board", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas", "typography_drafts", "refined_svgs", "compare"]),
      });
      onProjectData(project);
      await wait(480);

      setProductionStage("placing_compare_board");
      postStageBoard(project, "compare");
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("generating_backgrounds");
      setStatusLogs((entries) => [...entries, "Primary案に合わせて背景3案を生成しています。"]);
      const backgroundResult = await runFinishWorkflow(comparisonResult.backgroundBrief);
      project = buildProjectData({
        exploreResult: result,
        svgCandidates: svgResult.svgs,
        comparisonResult,
        backgroundResult,
        productionStatus: { stage: "placing_background_board", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas", "typography_drafts", "refined_svgs", "compare", "background_variations"]),
      });
      onProjectData(project);
      await wait(480);

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
      await wait(360);
      postStageBoard(project, "final_candidate");
      setFigmaOutputs(project.figmaOutputs ?? []);

      const completedProject = { ...project, productionStatus: { stage: "completed" as const, startedAt, completedAt: new Date().toISOString() } };
      setProductionStage("completed");
      onProjectData(completedProject);
      setSuccess("制作プロセスが完了しました。");
      setStatusLogs((entries) => [...entries, "30案探索、15案ドラフト、5案SVG、比較結果、背景3案、Final CandidateをFigmaに記録しました。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "自動制作を実行できませんでした。";
      setError(message);
      setProductionStage("error");
      setStatusLogs((entries) => [...entries, message, "設定が未完了の場合は、設定画面でAPI設定を確認してください。"]);
    } finally {
      setIsGenerating(false);
    }
  }

  function createExploreInput(): ExploreInput {
    const sourceMode = inputMode === "figma_variation" ? "figma_reference" : inputMode;
    return {
      contentType,
      inputMode: sourceMode,
      projectName,
      briefText: sourceMode === "fixed_copy" ? undefined : briefText,
      fixedCopy: sourceMode === "fixed_copy" ? { ...fixedCopy, cta: ctaText } : undefined,
      rawInput: `${briefText}\nターゲット: ${targetAudience}\n訴求ポイント: ${appealPoint}\nトーン: ${toneValue}\nCTA: ${ctaText}`,
      targetAudience,
      tone: toneValue,
      goal: appealPoint,
      pdfText: sourceMode === "pdf" ? pdfText || briefText : undefined,
      pdfFileName: sourceMode === "pdf" ? pdfFileName : undefined,
      referenceFrameSummary: sourceMode === "figma_reference" ? referenceFrameSummary : undefined,
      assumptions: [],
    };
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
    setProjectName("オンラインセミナー集客バナー");
    setBriefText(sampleBriefs.seminar_banner);
    setFixedCopy(defaultFixedCopy);
    setTargetAudience("忙しいビジネスパーソン");
    setAppealPoint("60分で学べる / 明日から使える");
    setToneValue("信頼感 + 親しみやすさ");
    setCtaText(defaultFixedCopy.cta ?? "無料で参加する");
    setPdfFileName("");
    setPdfText("");
    setPdfStatus("");
    setReferenceFrameSummary("");
    setStatusLogs(["結果をリセットしました。要件を入力して自動制作を開始できます。"]);
  }

  return (
    <div className="explore-layout auto-production-grid">
      <section className="panel requirement-panel">
        <SectionHeader title="要件入力" description="制作ジョブの起点です。最低限の入力でも、足りない情報はAIが仮説で補います。" />
        <div className="requirement-form">
          <InputModeSelector value={inputMode} onChange={setInputMode} />
          <PresetSelector value={contentType} onChange={setContentType} />
          <label className="field">
            <span>プロジェクト名</span>
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} />
          </label>
          {inputMode === "fixed_copy" ? (
            <div className="fixed-copy-fields">
              <label className="field">
                <span>メインコピー</span>
                <textarea value={fixedCopy.main} onChange={(event) => setFixedCopy((current) => ({ ...current, main: event.target.value }))} />
              </label>
              <label className="field">
                <span>サブコピー</span>
                <input value={fixedCopy.sub} onChange={(event) => setFixedCopy((current) => ({ ...current, sub: event.target.value }))} />
              </label>
              <label className="field">
                <span>日時</span>
                <input value={`${fixedCopy.date ?? ""} ${fixedCopy.time ?? ""}`.trim()} onChange={(event) => setFixedCopy((current) => ({ ...current, date: event.target.value }))} />
              </label>
            </div>
          ) : (
            <label className="field full-width">
              <span>{inputMode === "minimal_prompt" ? "作りたいもの" : inputMode === "pdf" ? "資料から抽出した内容 / 補足" : "内容"}</span>
              <textarea value={briefText} onChange={(event) => setBriefText(event.target.value)} placeholder={sampleBriefs[contentType]} />
            </label>
          )}
          {inputMode === "pdf" && (
            <div className="pdf-input-box">
              <input type="file" accept="application/pdf" onChange={(event) => void handlePdfFile(event.target.files?.[0])} />
              <p>{pdfFileName ? `選択中: ${pdfFileName}` : "PDFを選択してください。抽出できない場合は内容を要件欄へ貼り付けてください。"}</p>
              {pdfStatus && <small>{pdfStatus}</small>}
            </div>
          )}
          {inputMode === "figma_reference" && (
            <div className="pdf-input-box">
              <button className="secondary-button" type="button" onClick={requestReferenceFrame}>
                選択中フレームを参考にする
              </button>
              <p>{referenceFrameSummary || "Figma上で参考にしたいフレームを1つ選択してから取得してください。"}</p>
            </div>
          )}
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
        <UsageGuide note="AIが入力内容をもとに、探索、文字組み、高品質SVG、比較、背景生成まで自動で進行します。" />
        <ActionBar>
          <button className="primary-button" type="button" disabled={isGenerating} onClick={runFullAutoProduction}>
            {isGenerating ? "制作中..." : productionStage === "completed" ? "再実行" : "自動制作を開始"}
          </button>
          <button className="secondary-button" type="button" disabled={isGenerating} onClick={() => loadSample("seminar_banner")}>
            サンプルから開始
          </button>
          <button className="ghost-button" type="button" onClick={handleReset}>
            リセット
          </button>
        </ActionBar>
      </section>

      <section className="panel production-panel">
        <SectionHeader
          title="段階型Explore / 自動制作フロー"
          description="タブを順番に押すのではなく、1つの制作ジョブとしてFinal Candidateまで進めます。"
          aside={<ProviderBadge label="SVG" provider={providers.svg} />}
        />
        <div className="badge-row">
          <CanvasBadge />
          <span className={executionMode === "Live" ? "provider-badge success" : "provider-badge warning"}>実行モード: {executionMode}</span>
          <ProviderBadge label="provider" provider={providers.copy} />
          <span className="provider-badge">現在: {getProductionStageLabel(productionStage)}</span>
        </div>
        <ProductionTimeline currentStage={productionStage} items={productionTimelineItems} />
        {isGenerating && <LoadingState title={getProductionStageLabel(productionStage)} description={getProductionStageMessage(productionStage)} />}
        {error && <ErrorMessage title="自動制作を実行できませんでした" detail={error} action="設定画面でAPI設定を確認するか、入力内容を調整してください。" />}
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
  { stage: "exploring_ideas", title: "30案を探索", description: "コピー、訴求軸、トーン、レイアウト方向を広げます。" },
  { stage: "placing_ideas_board", title: "30案探索ボードを記録", description: "探索結果をFigmaに記録します。", figmaStage: true },
  { stage: "generating_typography_drafts", title: "15案の文字組みを生成", description: "余白、CTA位置、情報優先順位を検討します。" },
  { stage: "placing_typography_board", title: "15案ドラフトボードを記録", description: "文字組みドラフトをFigmaに記録します。", figmaStage: true },
  { stage: "selecting_refined_candidates", title: "5案を選定", description: "比較しやすい方向性へ絞ります。" },
  { stage: "generating_refined_svgs", title: "5案を高品質SVG化", description: "Figmaで見せられるSVGに整えます。" },
  { stage: "placing_refined_board", title: "5案SVGを記録", description: "5案ボードと実SVGをFigmaに配置します。", figmaStage: true },
  { stage: "running_auto_compare", title: "5案を比較", description: "Primary / Secondary候補を整理します。" },
  { stage: "placing_compare_board", title: "比較結果を記録", description: "比較表とbackground briefをFigmaに記録します。", figmaStage: true },
  { stage: "generating_backgrounds", title: "背景3案を生成", description: "Primary案に合わせた背景方針を作ります。" },
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
    const sub = direction?.copy.sub ?? candidate.previewLabel ?? "比較用の自動生成候補";
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

function createRawInputText(input: Awaited<ReturnType<typeof normalizeCreativeInput>>): string {
  return [
    `プロジェクト名: ${input.projectName}`,
    `用途: ${input.contentType}`,
    input.goal ? `ゴール: ${input.goal}` : "",
    input.target ? `ターゲット: ${input.target}` : "",
    input.tone ? `トーン: ${input.tone}` : "",
    input.briefText ? `要件: ${input.briefText}` : "",
    input.fixedCopy ? `確定コピー: ${input.fixedCopy.main} / ${input.fixedCopy.sub ?? ""} / ${input.fixedCopy.cta ?? ""}` : "",
    input.pdfText ? `PDF要約元テキスト: ${input.pdfText.slice(0, 1200)}` : "",
    input.referenceFrameSummary ? `参考Figma案: ${input.referenceFrameSummary}` : "",
    input.assumptions.length ? `AI補完: ${input.assumptions.join(" / ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function summarizeReferenceFrame(frame: FigmaFrameData): string {
  const title = frame.derived.possibleMainTitle?.characters ?? frame.textNodes[0]?.characters ?? frame.name;
  const text = frame.textNodes.map((node) => node.characters).join(" / ").slice(0, 420);
  return `${frame.name} (${Math.round(frame.width)}x${Math.round(frame.height)})。主見出し候補: ${title}。テキスト: ${text}`;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function validateInput(input: ExploreInput): string | null {
  if (input.inputMode === "minimal_prompt" && (input.briefText ?? "").trim().length === 0) return "作りたいものを入力してください。";
  if (input.inputMode === "brief_text" && (input.briefText ?? "").trim().length === 0) return "要件テキストを入力してください。";
  if (input.inputMode === "pdf" && !(input.pdfText || input.briefText)?.trim()) {
    return "PDFからテキストを取得できない場合は、要件欄に内容を貼り付けてください。";
  }
  if (input.inputMode === "figma_reference" && !(input.referenceFrameSummary || input.briefText)?.trim()) {
    return "参考にしたいFigmaフレームを選択するか、補足要件を入力してください。";
  }
  if (input.inputMode === "fixed_copy") {
    if (!input.fixedCopy?.main.trim()) return "メインコピーを入力してください。";
    if (!input.fixedCopy.sub.trim()) return "サブコピーを入力してください。";
    if (input.contentType === "seminar_banner" && !input.fixedCopy.cta?.trim()) return "セミナーバナーではCTAを入力してください。";
  }
  return null;
}
