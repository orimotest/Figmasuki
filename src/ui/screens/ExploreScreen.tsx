import { useEffect, useState } from "react";
import type { ContentType } from "../../schemas/content";
import type { FixedCopyInput, InputMode, ExploreInput, NormalizedCreativeInput } from "../../schemas/input";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import type { FigmaOutputRecord, ProcessBoardStage, ProductionStage } from "../../schemas/production";
import type { ExploreResult, SvgCandidate } from "../../schemas/svg";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { organizeInputWithDify } from "../../providers/dify/inputOrganizerClient";
import { extractPdfText } from "../../utils/extractPdfText";
import { runCompareWorkflow } from "../../workflows/compareWorkflow";
import { runExploreWorkflow } from "../../workflows/exploreWorkflow";
import { runFinishWorkflow } from "../../workflows/finishWorkflow";
import { runGenerateSvgWorkflow } from "../../workflows/generateSvgWorkflow";
import { normalizeCreativeInput } from "../../workflows/inputNormalizeWorkflow";
import { buildProjectData } from "../projectBuilder";
import { ActionBar } from "../components/ActionBar";
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
import { contentTypeLabels, inputModeLabels } from "../labels";

type ExploreScreenProps = {
  phase?: "brief" | "production";
  providers: ProviderConfig;
  projectData: ProjectData | null;
  onProceedToProduction?: () => void;
  onProjectData: (project: ProjectData | null) => void;
};

const sampleBriefs = {
  note_thumbnail:
    "note記事のサムネイル。テーマは「AI時代にデザイナーが持つべき判断力」。派手なAI感ではなく、制作現場で考え続ける人に届く静かな編集感にしたい。",
  seminar_banner:
    "オンラインセミナー集客用のバナー。対象はAI活用に関心はあるが、何から試すべきか迷っている事業部門の担当者。60分で基本の考え方と明日使える実践例を持ち帰れることを伝えたい。信頼感は保ちつつ、難しそうに見せない。",
} satisfies Record<ContentType, string>;

const emptyFixedCopy: FixedCopyInput = {
  main: "",
  sub: "",
  cta: "",
  date: "",
  time: "",
};

const sampleFixedCopy: FixedCopyInput = {
  main: "60分でわかる\nAI活用の第一歩",
  sub: "現場で試せる考え方と実践例を紹介",
  cta: "無料で参加する",
  date: "6.18 WED",
  time: "14:00-15:00",
};

export function ExploreScreen({ phase = "production", providers, projectData, onProceedToProduction, onProjectData }: ExploreScreenProps) {
  const [contentType, setContentType] = useState<ContentType>("seminar_banner");
  const [inputMode, setInputMode] = useState<InputMode>("brief_text");
  const [projectName, setProjectName] = useState("");
  const [briefText, setBriefText] = useState("");
  const [fixedCopy, setFixedCopy] = useState<FixedCopyInput>(emptyFixedCopy);
  const [targetAudience, setTargetAudience] = useState("");
  const [appealPoint, setAppealPoint] = useState("");
  const [toneValue, setToneValue] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [pdfText, setPdfText] = useState("");
  const [pdfStatus, setPdfStatus] = useState("");
  const [referenceFrameSummary, setReferenceFrameSummary] = useState("");
  const [productionBrief, setProductionBrief] = useState<NormalizedCreativeInput | null>(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusLogs, setStatusLogs] = useState<string[]>(["要件を入力して、自動制作を開始できます。"]);
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
      if (!isGenerating && !isOrganizing) void runFullAutoProduction();
    };
    window.addEventListener("START_AUTO_PRODUCTION", handleHeaderStart);
    return () => window.removeEventListener("START_AUTO_PRODUCTION", handleHeaderStart);
  }, [isGenerating, isOrganizing, contentType, inputMode, briefText, fixedCopy, targetAudience, appealPoint, toneValue, ctaText, pdfText, referenceFrameSummary, productionBrief]);

  const workflow = projectData?.stageWorkflow;
  const visibleSvgCandidates = svgCandidates.length ? svgCandidates : projectData?.svgCandidates ?? [];
  const primaryCandidate =
    visibleSvgCandidates.find((candidate) => candidate.id === projectData?.comparisonResult?.recommendation.primaryFrameId) ?? visibleSvgCandidates[0];

  function loadSample(type: ContentType = "seminar_banner") {
    setContentType(type);
    setInputMode("brief_text");
    setProjectName(type === "seminar_banner" ? "オンラインセミナー集客バナー" : "AI時代のデザイン思考サムネイル");
    setBriefText(sampleBriefs[type]);
    setFixedCopy(sampleFixedCopy);
    setTargetAudience(type === "seminar_banner" ? "AI活用を検討する事業部門の担当者" : "デザイナー、編集者、個人クリエイター");
    setAppealPoint(type === "seminar_banner" ? "60分で基本が分かる / 明日から小さく試せる" : "AI時代の制作判断を、現場の言葉で考える");
    setToneValue(type === "seminar_banner" ? "信頼感 + やさしい実務感" : "知的 + 静かな編集感");
    setCtaText(type === "seminar_banner" ? "無料で参加する" : "");
    setPdfFileName("");
    setPdfText("");
    setPdfStatus("");
    setReferenceFrameSummary("");
    setProductionBrief(null);
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
    const rawInput = productionBrief ? createExploreInputFromProductionBrief(productionBrief) : createExploreInput();
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
      const normalized = productionBrief ?? (await organizeInputWithDify(rawInput));
      if (!productionBrief) setProductionBrief(normalized);
      const workflowInput = createExploreInputFromProductionBrief(normalized);

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
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("running_auto_compare");
      setStatusLogs((entries) => [...entries, "5案を自動比較し、ベース案と背景生成方針を整理しています。"]);
      const comparisonResult = await runCompareWorkflow(createAutoCompareFrames(project), project.contentType);
      project = buildProjectData({
        exploreResult: result,
        svgCandidates: svgResult.svgs,
        comparisonResult,
        productionStatus: { stage: "placing_compare_board", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas", "typography_drafts", "refined_svgs", "compare"]),
      });
      onProjectData(project);
      await wait(420);

      setProductionStage("placing_compare_board");
      postStageBoard(project, "compare");
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("generating_backgrounds");
      setStatusLogs((entries) => [...entries, "比較結果をもとに背景画像3案を生成しています。"]);
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
      await wait(520);

      setProductionStage("placing_background_board");
      postStageBoard(project, "background_variations");
      setFigmaOutputs(project.figmaOutputs ?? []);

      setProductionStage("placing_final_candidate");
      setStatusLogs((entries) => [...entries, "最終候補を背景レイヤーとSVG/テキストレイヤーに分けてFigmaへ記録しています。"]);
      project = buildProjectData({
        exploreResult: result,
        svgCandidates: svgResult.svgs,
        comparisonResult,
        backgroundResult,
        productionStatus: { stage: "placing_final_candidate", startedAt },
        figmaOutputs: createOutputRecords(["project_header", "ideas", "typography_drafts", "refined_svgs", "compare", "background_variations", "final_candidate"]),
      });
      onProjectData(project);
      await wait(420);
      postStageBoard(project, "final_candidate");
      setFigmaOutputs(project.figmaOutputs ?? []);

      const completedProject = { ...project, productionStatus: { stage: "completed" as const, startedAt, completedAt: new Date().toISOString() } };
      setProductionStage("completed");
      onProjectData(completedProject);
      setSuccess("画像生成まで含めた制作が完了しました。");
      setStatusLogs((entries) => [...entries, "30案探索、15案ドラフト、5案SVG、比較結果、背景3案、最終候補をFigmaに記録しました。"]);
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

  function createExploreInputFromProductionBrief(brief: NormalizedCreativeInput): ExploreInput {
    return {
      contentType: brief.contentType,
      inputMode: brief.inputSource,
      projectName: brief.projectName,
      briefText: brief.briefText,
      fixedCopy: brief.inputSource === "fixed_copy" ? brief.fixedCopy : undefined,
      rawInput: createRawInputText(brief),
      targetAudience: brief.target,
      tone: brief.tone,
      goal: brief.goal,
      pdfText: brief.pdfText,
      pdfFileName: brief.pdfFileName,
      referenceFrameSummary: brief.referenceFrameSummary,
      assumptions: brief.assumptions,
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
    setProjectName("");
    setBriefText("");
    setFixedCopy(emptyFixedCopy);
    setTargetAudience("");
    setAppealPoint("");
    setToneValue("");
    setCtaText("");
    setPdfFileName("");
    setPdfText("");
    setPdfStatus("");
    setReferenceFrameSummary("");
    setProductionBrief(null);
    setStatusLogs(["結果をリセットしました。要件を入力して自動制作を開始できます。"]);
  }

  async function handleProceedToProduction() {
    const validationMessage = validateInput(createExploreInput());
    if (validationMessage) {
      setError(validationMessage);
      setStatusLogs((entries) => [...entries, validationMessage]);
      return;
    }
    setError(null);
    setSuccess(null);
    setIsOrganizing(true);
    setStatusLogs((entries) => [...entries, "要件を制作ブリーフへ整理しています。"]);
    try {
      const normalized = await organizeInputWithDify(createExploreInput());
      setProductionBrief(normalized);
      setSuccess("制作ブリーフを整理しました。必要に応じて編集できます。");
      setStatusLogs((entries) => [...entries, "制作ブリーフを整理しました。"]);
      onProceedToProduction?.();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "要件を整理できませんでした。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsOrganizing(false);
    }
  }

  const requirementEditor = (
    <>
      <div className="requirement-form">
        <InputModeSelector value={inputMode} onChange={setInputMode} />

        {inputMode === "minimal_prompt" && (
          <label className="field full-width primary-input-field">
            <span>作りたいもの</span>
            <textarea
              value={briefText}
              onChange={(event) => setBriefText(event.target.value)}
              placeholder="作りたい内容、対象、伝えたいことを自由に入力"
            />
          </label>
        )}

        {inputMode === "brief_text" && (
          <div className="brief-text-fields">
            <label className="field full-width primary-input-field">
              <span>要件テキスト</span>
              <textarea value={briefText} onChange={(event) => setBriefText(event.target.value)} placeholder="作りたい内容、対象、伝えたいこと、必ず入れたい情報を入力" />
            </label>
            <div className="quick-field-grid">
              <label className="field">
                <span>ターゲット</span>
                <input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} placeholder="AIが補完できます" />
              </label>
              <label className="field">
                <span>訴求ポイント</span>
                <input value={appealPoint} onChange={(event) => setAppealPoint(event.target.value)} placeholder="AIが補完できます" />
              </label>
              <label className="field">
                <span>トーン</span>
                <input value={toneValue} onChange={(event) => setToneValue(event.target.value)} placeholder="AIが補完できます" />
              </label>
              <label className="field">
                <span>CTA</span>
                <input value={ctaText} onChange={(event) => setCtaText(event.target.value)} placeholder="例: 申し込む / 詳細を見る" />
              </label>
            </div>
          </div>
        )}

        {inputMode === "fixed_copy" && (
          <div className="fixed-copy-fields fixed-copy-grid">
            <label className="field">
              <span>メインコピー</span>
              <textarea
                value={fixedCopy.main}
                onChange={(event) => setFixedCopy((current) => ({ ...current, main: event.target.value }))}
                placeholder={"例: 60分でわかる\nAI活用の第一歩"}
              />
            </label>
            <label className="field">
              <span>サブコピー</span>
              <input
                value={fixedCopy.sub}
                onChange={(event) => setFixedCopy((current) => ({ ...current, sub: event.target.value }))}
                placeholder="例: 業務改善に使える考え方と実践例を紹介"
              />
            </label>
            <label className="field">
              <span>日時</span>
              <input
                value={`${fixedCopy.date ?? ""} ${fixedCopy.time ?? ""}`.trim()}
                onChange={(event) => setFixedCopy((current) => ({ ...current, date: event.target.value, time: "" }))}
                placeholder="例: 6.18 WED 14:00-15:00"
              />
            </label>
            <label className="field">
              <span>CTA</span>
              <input value={ctaText} onChange={(event) => setCtaText(event.target.value)} placeholder="例: 申し込む / 詳細を見る" />
            </label>
          </div>
        )}

        {inputMode === "pdf" && (
          <div className="source-input-stack">
            <div className="pdf-input-box large-drop-area">
              <input type="file" accept="application/pdf" onChange={(event) => void handlePdfFile(event.target.files?.[0])} />
              <p>{pdfFileName ? `選択中: ${pdfFileName}` : "PDFを選択"}</p>
              {pdfStatus && <small>{pdfStatus}</small>}
            </div>
            <label className="field full-width primary-input-field">
              <span>資料から抽出した内容 / 補足</span>
              <textarea value={briefText} onChange={(event) => setBriefText(event.target.value)} placeholder="PDFから抽出できない場合や補足したい条件をここに入力" />
            </label>
          </div>
        )}

        {inputMode === "figma_reference" && (
          <div className="source-input-stack">
            <div className="pdf-input-box reference-frame-box">
              <button className="secondary-button" type="button" onClick={requestReferenceFrame}>
                選択中フレームを取得
              </button>
              <p>{referenceFrameSummary || "参考フレーム未取得"}</p>
            </div>
            <label className="field full-width primary-input-field">
              <span>追加したい要件</span>
              <textarea value={briefText} onChange={(event) => setBriefText(event.target.value)} placeholder="参考フレームから変えたい点、残したい雰囲気、追加コピーなど" />
            </label>
          </div>
        )}

        <div className="requirement-top-row">
          <PresetSelector value={contentType} onChange={setContentType} />
          <label className="field">
            <span>プロジェクト名</span>
            <input value={projectName} onChange={(event) => setProjectName(event.target.value)} placeholder="未入力でもAIが補完できます" />
          </label>
        </div>
      </div>
    </>
  );

  const advancedEditor = (
    <details className="advanced-fields">
      <summary>詳細条件を調整</summary>
      <div>
        <label className="field">
          <span>ターゲット</span>
          <input value={targetAudience} onChange={(event) => setTargetAudience(event.target.value)} placeholder="例: 忙しいビジネスパーソン" />
        </label>
        <label className="field">
          <span>訴求ポイント</span>
          <input value={appealPoint} onChange={(event) => setAppealPoint(event.target.value)} placeholder="例: 60分で学べる / 明日から使える" />
        </label>
        <label className="field">
          <span>トーン</span>
          <input value={toneValue} onChange={(event) => setToneValue(event.target.value)} placeholder="例: 信頼感 + 親しみやすさ" />
        </label>
      </div>
    </details>
  );

  if (phase === "brief") {
    return (
      <div className="brief-layout">
        <section className="panel requirement-panel">
          <SectionHeader title="制作要件" description="入力方法に合わせて、必要な項目だけを記入できます。" />
          {requirementEditor}
          {error && <ErrorMessage title="要件を確認してください" detail={error} action="不足している項目を入力すると、自動制作へ進めます。" />}
          {success && <SuccessMessage title={success} />}
          <ActionBar>
            <button className="primary-button" type="button" disabled={isOrganizing} onClick={() => void handleProceedToProduction()}>
              {isOrganizing ? "ブリーフ整理中..." : "この要件で自動制作へ"}
            </button>
            <button className="secondary-button" type="button" onClick={() => loadSample("seminar_banner")}>
              セミナーサンプル
            </button>
            <button className="secondary-button" type="button" onClick={() => loadSample("note_thumbnail")}>
              noteサンプル
            </button>
            <button className="ghost-button" type="button" onClick={handleReset}>
              リセット
            </button>
          </ActionBar>
          {inputMode !== "brief_text" && advancedEditor}
        </section>
      </div>
    );
  }

  return (
    <div className="explore-layout auto-production-grid">
      <section className="panel requirement-summary-panel">
        <SectionHeader title="制作ブリーフ" description="目的、相手、訴求が揃っているかを確認してから自動制作へ進みます。" />
        {productionBrief ? (
          <ProductionBriefEditor brief={productionBrief} onChange={setProductionBrief} />
        ) : (
          <EmptyState title="制作ブリーフ未整理" body="要件タブで入力内容を確認し、制作ブリーフを作成してから開始します。" />
        )}
        <ActionBar>
          <button className="primary-button" type="button" disabled={isGenerating || !productionBrief} onClick={runFullAutoProduction}>
            {isGenerating ? "制作中..." : productionStage === "completed" ? "再実行" : "自動制作を開始"}
          </button>
          {!productionBrief && (
            <button className="secondary-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent("CHANGE_APP_TAB", { detail: "Brief" }))}>
              要件を編集
            </button>
          )}
        </ActionBar>
      </section>

      <section className="panel production-panel">
        <SectionHeader
          title="段階型Explore / 自動制作フロー"
          description="要件整理後はAIに任せて、比較・背景画像生成・最終候補の記録まで一括で進めます。"
          aside={<ProviderBadge label="SVG" provider={providers.svg} />}
        />
        <div className="badge-row production-context-row">
          <span className="provider-badge">現在: {getProductionStageLabel(productionStage)}</span>
          <ProviderBadge label="copy" provider={providers.copy} />
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
        <FinalCandidatePreview candidate={primaryCandidate} completed={productionStage === "completed"} hasBackground={Boolean(projectData?.backgroundResult)} />
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

function ProductionBriefEditor({ brief, onChange }: { brief: NormalizedCreativeInput; onChange: (brief: NormalizedCreativeInput) => void }) {
  function updateField<K extends keyof NormalizedCreativeInput>(key: K, value: NormalizedCreativeInput[K]) {
    onChange({ ...brief, [key]: value });
  }

  function updateFixedCopy<K extends keyof FixedCopyInput>(key: K, value: string) {
    onChange({
      ...brief,
      fixedCopy: {
        main: brief.fixedCopy?.main ?? "",
        sub: brief.fixedCopy?.sub ?? "",
        cta: brief.fixedCopy?.cta ?? "",
        date: brief.fixedCopy?.date ?? "",
        time: brief.fixedCopy?.time ?? "",
        [key]: value,
      },
    });
  }

  return (
    <div className="production-brief-editor">
      <div className="production-brief-meta">
        <span>{contentTypeLabels[brief.contentType]}</span>
        <span>{inputModeLabels[brief.inputSource]}</span>
      </div>

      <label className="field production-brief-main">
        <span>整理された要件</span>
        <textarea value={brief.briefText ?? ""} onChange={(event) => updateField("briefText", event.target.value)} />
      </label>

      <div className="production-brief-grid">
        <label className="field">
          <span>プロジェクト名</span>
          <input value={brief.projectName} onChange={(event) => updateField("projectName", event.target.value)} />
        </label>
        <label className="field">
          <span>目的</span>
          <input value={brief.goal ?? ""} onChange={(event) => updateField("goal", event.target.value)} />
        </label>
        <label className="field">
          <span>ターゲット</span>
          <input value={brief.target ?? ""} onChange={(event) => updateField("target", event.target.value)} />
        </label>
        <label className="field">
          <span>トーン</span>
          <input value={brief.tone ?? ""} onChange={(event) => updateField("tone", event.target.value)} />
        </label>
      </div>

      <details className="production-brief-details">
        <summary>コピー・補完内容を確認</summary>
        <div className="production-brief-grid">
          <label className="field">
            <span>メインコピー</span>
            <textarea value={brief.fixedCopy?.main ?? ""} onChange={(event) => updateFixedCopy("main", event.target.value)} />
          </label>
          <label className="field">
            <span>サブコピー</span>
            <input value={brief.fixedCopy?.sub ?? ""} onChange={(event) => updateFixedCopy("sub", event.target.value)} />
          </label>
          <label className="field">
            <span>CTA</span>
            <input value={brief.fixedCopy?.cta ?? ""} onChange={(event) => updateFixedCopy("cta", event.target.value)} />
          </label>
          <label className="field">
            <span>日時</span>
            <input value={`${brief.fixedCopy?.date ?? ""} ${brief.fixedCopy?.time ?? ""}`.trim()} onChange={(event) => updateFixedCopy("date", event.target.value)} />
          </label>
        </div>
      </details>

      {(brief.missingInfo.length > 0 || brief.assumptions.length > 0) && (
        <div className="production-brief-notes">
          {brief.missingInfo.length > 0 && (
            <div>
              <strong>未確定</strong>
              <div className="keyword-row">{brief.missingInfo.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
          )}
          {brief.assumptions.length > 0 && (
            <div>
              <strong>補完メモ</strong>
              <ul>
                {brief.assumptions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function BriefSummary({
  contentType,
  inputMode,
  projectName,
  briefText,
  fixedCopy,
  targetAudience,
  appealPoint,
  toneValue,
  ctaText,
  pdfFileName,
  referenceFrameSummary,
  compact = false,
}: {
  contentType: ContentType;
  inputMode: InputMode;
  projectName: string;
  briefText: string;
  fixedCopy: FixedCopyInput;
  targetAudience: string;
  appealPoint: string;
  toneValue: string;
  ctaText: string;
  pdfFileName: string;
  referenceFrameSummary: string;
  compact?: boolean;
}) {
  const mainContent = inputMode === "fixed_copy" ? fixedCopy.main : briefText;
  const missingItems = [
    mainContent.trim() ? "" : inputMode === "fixed_copy" ? "メインコピー" : "内容",
    contentType === "seminar_banner" && !ctaText.trim() ? "CTA" : "",
  ].filter(Boolean);

  const rows: [string, string][] = [
    ["用途", contentTypeLabels[contentType]],
    ["入力モード", inputModeLabels[inputMode]],
    ["プロジェクト", projectName || "AIが補完"],
    ["内容", mainContent || "未入力"],
    ["CTA", ctaText || "任意"],
    ["ターゲット", targetAudience || "AIが補完"],
    ["訴求", appealPoint || "AIが補完"],
    ["トーン", toneValue || "AIが補完"],
  ];
  if (pdfFileName) rows.push(["PDF", pdfFileName]);
  if (referenceFrameSummary) rows.push(["参考Figma", referenceFrameSummary]);

  return (
    <div className={compact ? "brief-summary compact" : "brief-summary"}>
      <dl className="review-info-list">
        {rows.slice(0, compact ? 6 : rows.length).map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className={missingItems.length ? "brief-readiness warn" : "brief-readiness ready"}>
        <strong>{missingItems.length ? "確認したい項目" : "自動制作に進めます"}</strong>
        <span>{missingItems.length ? missingItems.join(" / ") : "最低限の要件が揃っています。"}</span>
      </div>
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

function FinalCandidatePreview({ candidate, completed, hasBackground }: { candidate?: SvgCandidate; completed: boolean; hasBackground: boolean }) {
  return (
    <div className="result-card final-preview-card">
      <div className="result-card-header">
        <strong>最終候補</strong>
        <span>{completed ? "画像生成まで完了" : hasBackground ? "背景生成済み" : "生成中"}</span>
      </div>
      {candidate ? (
        <>
          <MiniSvgPreview svg={candidate.svg} label={candidate.name} large />
          <p>制作フロー内で選ばれた案に背景画像を合わせ、Figmaでは背景レイヤーとSVG/テキストレイヤーを分けて記録します。</p>
        </>
      ) : (
        <EmptyState title="最終候補を生成中" body="比較と背景生成まで完了すると、ここに候補が表示されます。" />
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
  { stage: "running_auto_compare", title: "5案を比較", description: "Primary / Secondary候補と背景生成方針を整理します。" },
  { stage: "placing_compare_board", title: "比較結果を記録", description: "比較表と背景生成ブリーフをFigmaに記録します。", figmaStage: true },
  { stage: "generating_backgrounds", title: "背景3案を生成", description: "Primary案に合わせた背景画像を生成します。" },
  { stage: "placing_background_board", title: "背景案を記録", description: "背景3案をFigmaに記録します。", figmaStage: true },
  { stage: "placing_final_candidate", title: "最終候補を記録", description: "背景レイヤーとSVG/テキストレイヤーを分けてFigmaに記録します。", figmaStage: true },
  { stage: "completed", title: "画像生成まで完了", description: "自動制作ジョブが完了しました。" },
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
    const sub = direction?.copy.sub ?? candidate.previewLabel ?? project.inputSummary.brief;
    const cta = direction?.copy.cta ?? (project.contentType === "seminar_banner" ? "詳細を見る" : "");
    const date = project.contentType === "seminar_banner" ? createTextNode(`auto_${candidate.id}_date`, "Date", "6.18 WED 14:00", 56, 334, 180, 28, 16) : undefined;
    const ctaNode = cta ? createTextNode(`auto_${candidate.id}_cta`, "CTA", cta, 560, 354, 180, 42, 18) : undefined;
    const textNodes = [
      createTextNode(`auto_${candidate.id}_main`, "Main Copy", main, 56, 112, 520, 96, 56),
      createTextNode(`auto_${candidate.id}_sub`, "Sub Copy", sub, 56, 250, 520, 40, 22),
      date,
      ctaNode,
    ].filter((node): node is FigmaFrameData["textNodes"][number] => Boolean(node));

    return {
      id: candidate.id,
      name: candidate.name || `生成案 ${index + 1}`,
      x: index * 900,
      y: 0,
      width: candidate.width,
      height: candidate.height,
      textNodes,
      shapeNodes: [],
      derived: {
        textCount: textNodes.length,
        shapeCount: 0,
        totalTextChars: textNodes.reduce((total, node) => total + node.characters.length, 0),
        maxFontSize: Math.max(...textNodes.map((node) => node.fontSize ?? 0)),
        minFontSize: Math.min(...textNodes.map((node) => node.fontSize ?? 999)),
        colors: [],
        colorCount: 0,
        elementDensity: 0.02,
        frameSizeMatchesCanvas: true,
        possibleMainTitle: textNodes[0],
        possibleCTA: ctaNode,
        possibleDate: date,
        safeAreaIssues: [],
      },
    };
  });
}

function createTextNode(id: string, name: string, characters: string, x: number, y: number, width: number, height: number, fontSize: number): FigmaFrameData["textNodes"][number] {
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
    fills: [{ type: "SOLID", color: "#111827", opacity: 1 }],
    color: "#111827",
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
