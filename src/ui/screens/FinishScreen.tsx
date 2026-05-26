import { useEffect, useMemo, useState } from "react";
import type { BackgroundBrief, BackgroundResult } from "../../schemas/background";
import type { ComparisonResult } from "../../schemas/comparison";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import type { SvgCandidate } from "../../schemas/svg";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { runFinishWorkflow } from "../../workflows/finishWorkflow";
import { buildProjectData } from "../projectBuilder";
import { ActionBar } from "../components/ActionBar";
import { CanvasBadge } from "../components/CanvasBadge";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
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

const demoSvg = `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" rx="24" fill="#eff6ff"/><path d="M0 318 C150 260 245 345 410 288 C545 242 626 260 800 204 V450 H0 Z" fill="#dbeafe"/><rect x="28" y="28" width="744" height="394" rx="20" fill="rgba(255,255,255,.72)" stroke="#bfdbfe"/><text x="64" y="150" font-size="58" font-weight="800" fill="#1d4ed8" font-family="Inter, sans-serif">AI活用</text><text x="64" y="222" font-size="54" font-weight="800" fill="#0f172a" font-family="Inter, sans-serif">何から始める？</text><text x="64" y="286" font-size="24" font-weight="700" fill="#334155" font-family="Inter, sans-serif">明日から使える実践ステップを60分で解説</text><rect x="548" y="348" width="190" height="52" rx="26" fill="#16a34a"/><text x="643" y="381" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="Inter, sans-serif">無料で参加する</text></svg>`;

export function FinishScreen({ providers, backgroundBrief, comparisonResult, projectData, onProjectData, onBackground }: FinishScreenProps) {
  const [backgroundResult, setBackgroundResult] = useState<BackgroundResult | undefined>();
  const [statusLogs, setStatusLogs] = useState<string[]>(["比較で選ばれたPrimary案を仕上げる確認画面です。Demo Modeでは背景3案とFinal Candidateを確認できます。"]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState("soft");

  const activeBrief = backgroundBrief ?? backgroundResult?.brief ?? projectData?.backgroundResult?.brief ?? projectData?.comparisonResult?.backgroundBrief ?? comparisonResult?.backgroundBrief ?? demoBrief();
  const activeResult = backgroundResult ?? projectData?.backgroundResult;
  const primaryCandidate = useMemo(() => findPrimaryCandidate(projectData, activeBrief), [projectData, activeBrief]);
  const backgrounds = buildBackgroundOptions(projectData, activeResult);

  useEffect(() => {
    setBackgroundResult(undefined);
    setStatusLogs(["background briefを読み込みました。仕上げ対象と背景方針を確認できます。"]);
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
    setError(null);
    setSuccess(null);
    setIsGenerating(true);
    setStatusLogs((entries) => [...entries, "背景3案を生成しています。"]);
    try {
      const result = await runFinishWorkflow({ ...activeBrief, style: `${activeBrief.style} / ${selectedBackground}` });
      setBackgroundResult(result);
      onBackground(result);
      if (projectData) {
        onProjectData(buildProjectData({ ...projectDataToBuilder(projectData), backgroundResult: result }));
      }
      setStatusLogs((entries) => [...entries, result.providerMeta?.fallbackUsed ? "API未設定のためDemo背景で続行しました。" : "背景生成が完了しました。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "背景生成に失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleApplyBackground() {
    if (!activeResult) {
      setError("先に背景を生成してください。");
      return;
    }
    if (!activeBrief.targetFrameId) {
      setError("対象フレームIDがありません。比較画面からやり直してください。");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsApplying(true);
    setStatusLogs((entries) => [...entries, "対象フレームに背景を適用しています。"]);
    postToPlugin({ type: "APPLY_BACKGROUND", payload: { targetFrameId: activeBrief.targetFrameId, backgroundResult: activeResult } });
  }

  function handleRenderFinishBoard() {
    if (!activeResult) {
      setError("仕上げボードをFigmaに出力するには、先に背景を生成してください。");
      return;
    }
    postToPlugin({ type: "RENDER_FINISH_BOARD", payload: { backgroundResult: activeResult, comparisonResult } });
  }

  function handleCopyBrief() {
    const text = [`background brief`, activeBrief.promptText, `雰囲気: ${activeBrief.mood}`, `背景スタイル: ${activeBrief.style}`, `避けること: ${activeBrief.avoid.join(" / ")}`].join("\n");
    void navigator.clipboard?.writeText(text);
    setSuccess("background briefをコピーしました。");
  }

  return (
    <div className="review-screen">
      <div className="review-page-heading">
        <div>
          <p className="eyebrow">AI CREATIVE PROCESS BOARD <span className="step-pill">Step 4/4</span></p>
          <h2>仕上げ</h2>
          <p>比較で選ばれたベース案に背景を生成・適用し、Final Candidateを整えます。</p>
        </div>
        <div className="badge-row">
          <CanvasBadge />
          <span className="provider-badge warning">実行モード: Demo Mode</span>
          <ProviderBadge label="provider" provider={activeResult?.providerMeta?.provider ?? providers.background} fallbackUsed={activeResult?.providerMeta?.fallbackUsed} />
        </div>
      </div>

      <div className="review-layout finish-review-layout">
        <section className="panel review-side-panel">
          <SectionHeader title="仕上げ対象" description="比較で選ばれたPrimary案を仕上げます。" />
          <PreviewFigure svg={primaryCandidate?.svg ?? demoSvg} label={activeBrief.targetFrameName} />
          <InfoList items={[["案名", activeBrief.targetFrameName], ["ID", activeBrief.targetFrameId], ["サイズ", "800×450 固定"], ["タイプ", "セミナーバナー"], ["用途", "集客・告知"], ["トーン", "信頼感・親しみやすさ"]]} />
          <ChecklistCard title="仕上げの観点" items={["背景の方向性", "文字領域との相性", "CTAの見やすさ", "情報の読みやすさ", "ブランド感", "仕上げ後の使いやすさ"]} />
          <ChecklistCard title="処理の流れ" items={["ベース案を確認", "background briefを生成", "背景候補を生成", "適用イメージを確認", "最終候補を作成"]} completed />
        </section>

        <section className="panel review-main-panel">
          <SectionHeader title="background brief" description="文字やCTAを邪魔しない背景方針を整理します。" />
          {(isGenerating || isApplying) && <LoadingState title={isGenerating ? "背景を生成しています" : "背景を適用しています"} description="文字領域を保ったまま、背景だけを仕上げる想定で進めています。" />}
          {error && <ErrorMessage title="仕上げを実行できませんでした" detail={error} action="背景生成後にFigma反映してください。" />}
          {success && <SuccessMessage title={success} />}
          <InsightHero text={activeBrief.promptText} />
          <section className="review-card brief-card">
            <InfoList items={[["背景の方向性", activeBrief.promptText], ["雰囲気", activeBrief.mood], ["背景スタイル", activeBrief.style], ["避けること", activeBrief.avoid.join(" / ")], ["文字領域への配慮", activeBrief.safeAreaHint]]} />
            <div className="keyword-row">{activeBrief.suggestedStyleKeywords.map((keyword) => <span key={keyword}>{keyword}</span>)}</div>
          </section>
          <div className="insight-grid two">
            <NumberedCard title="適用方針" items={["コントラストを最適化し、可読性を確保する", "文字領域の背景はシンプルに保つ", "主見出しの周囲に十分な余白を確保する", "CTAが目立つように背景の彩度を抑える"]} />
            <InsightCard title="仕上げ後の期待" items={["読み物感が出る", "広告感を抑える", "CTAを邪魔しない", "Figma上で編集しやすい"]} />
          </div>
        </section>

        <section className="panel review-preview-panel">
          <SectionHeader title="生成された背景" description="3案のうち1案を選んでFinal Candidateに反映します。" />
          <div className="background-option-list">
            {backgrounds.map((option) => (
              <button key={option.id} className={selectedBackground === option.id ? "background-option active" : "background-option"} type="button" onClick={() => setSelectedBackground(option.id)}>
                <span>{option.label}</span>
                <strong>{option.name}</strong>
                <i style={{ background: option.preview }} />
                {selectedBackground === option.id && <em>選択中</em>}
              </button>
            ))}
          </div>
          <SectionHeader title={`適用後プレビュー（${backgrounds.find((item) => item.id === selectedBackground)?.name ?? "soft gradient"}）`} />
          <PreviewFigure svg={primaryCandidate?.svg ?? demoSvg} label="Final Candidate preview" large />
          <RatingCard title="仕上げ評価" rows={[["読みやすさ", "良い", 86], ["CTA視認性", "良い", 84], ["背景との相性", "良い", 82], ["完成度", "非常に良い", 92]]} />
          <section className="review-card"><h3>最終状態</h3><ul className="compat-list"><li><span>背景選定</span><strong>済み</strong></li><li><span>プレビュー確認</span><strong>済み</strong></li><li><span>Figma反映</span><strong>{activeResult ? "準備OK" : "背景生成待ち"}</strong></li></ul></section>
        </section>
      </div>

      <StatusLog entries={statusLogs.slice(-4)} />
      <ActionBar className="review-action-bar">
        <div className="action-group action-group-left">
          <button className="ghost-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent("CHANGE_APP_TAB", { detail: "Compare" }))}>比較に戻る</button>
        </div>
        <div className="action-group action-group-center">
          <button className="secondary-button" type="button" onClick={handleRenderFinishBoard}>仕上げボードをFigmaに出力</button>
          <button className="secondary-button" type="button" onClick={handleCopyBrief}>briefをコピー</button>
        </div>
        <div className="action-group action-group-right">
          <button className="primary-button" type="button" disabled={isGenerating} onClick={handleGenerateBackground}>{isGenerating ? "生成中..." : "背景3案を生成"}</button>
          <button className="primary-button" type="button" disabled={!activeResult || isApplying} onClick={handleApplyBackground}>{isApplying ? "反映中..." : "Final候補を確定"}</button>
        </div>
      </ActionBar>
    </div>
  );
}

function demoBrief(): BackgroundBrief {
  return {
    id: "demo-brief-finish",
    contentType: "seminar_banner",
    targetFrameId: "SEC_01",
    targetFrameName: "AI活用 何から始める？",
    mood: "editorial / quiet / thoughtful",
    style: "soft paper gradient with subtle abstract lines",
    avoid: ["文字の生成", "ロゴ", "過度な装飾", "中央の細かすぎる装飾"],
    safeAreaHint: "主見出しとCTAの背面は低コントラストにし、文字領域を邪魔しない。",
    suggestedStyleKeywords: ["editorial texture", "paper grain", "subtle abstract lines", "quiet contrast"],
    promptText: "読みやすさを維持しながら、静かな編集感のある背景で完成度を上げる方針です。",
  };
}

function findPrimaryCandidate(project: ProjectData | null, brief: BackgroundBrief): SvgCandidate | undefined {
  return project?.svgCandidates.find((candidate) => candidate.id === brief.targetFrameId || candidate.name === brief.targetFrameName) ?? project?.svgCandidates[0];
}

function buildBackgroundOptions(project: ProjectData | null, result: BackgroundResult | undefined) {
  const workflowOptions = project?.stageWorkflow?.backgroundVariations.map((item, index) => ({
    id: index === 0 ? "soft" : index === 1 ? "paper" : "geometry",
    label: `${String.fromCharCode(65 + index)}案`,
    name: item.name,
    preview: index === 0 ? "linear-gradient(135deg,#dbeafe,#eff6ff)" : index === 1 ? "linear-gradient(135deg,#f5efe4,#fffaf0)" : "linear-gradient(135deg,#eef6ff,#f8fafc)",
  }));
  if (workflowOptions?.length) return workflowOptions;
  return [
    { id: "soft", label: "A案", name: result?.styleName ?? "soft gradient", preview: "linear-gradient(135deg,#dbeafe,#eff6ff)" },
    { id: "paper", label: "B案", name: "editorial paper", preview: "linear-gradient(135deg,#f5efe4,#fffaf0)" },
    { id: "geometry", label: "C案", name: "subtle geometry", preview: "linear-gradient(135deg,#eef6ff,#f8fafc)" },
  ];
}

function PreviewFigure({ svg, label, large = false }: { svg: string; label: string; large?: boolean }) {
  return <figure className={large ? "review-preview-figure large" : "review-preview-figure"}><div className="review-svg-canvas" dangerouslySetInnerHTML={{ __html: svg }} /><figcaption>{label}</figcaption></figure>;
}

function InfoList({ items }: { items: [string, string][] }) {
  return <dl className="review-info-list">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function ChecklistCard({ title, items, completed = false }: { title: string; items: string[]; completed?: boolean }) {
  return <section className="review-card"><h3>{title}</h3><ul className="review-check-list">{items.map((item) => <li key={item}><span className={completed ? "check-dot done" : "check-dot"}>{completed ? "✓" : ""}</span>{item}</li>)}</ul></section>;
}

function InsightHero({ text }: { text: string }) {
  return <section className="insight-hero"><span>💡</span><strong>{text}</strong></section>;
}

function InsightCard({ title, items }: { title: string; items: string[] }) {
  return <article className="insight-card"><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></article>;
}

function NumberedCard({ title, items }: { title: string; items: string[] }) {
  return <article className="insight-card"><h3>{title}</h3><ol>{items.map((item) => <li key={item}>{item}</li>)}</ol></article>;
}

function RatingCard({ title, rows }: { title: string; rows: [string, string, number][] }) {
  return <section className="review-card"><h3>{title}</h3><div className="metric-list">{rows.map(([label, value, width]) => <div className="metric-row" key={label}><span>{label}</span><div><i style={{ width: `${width}%` }} /></div><em>{value}</em></div>)}</div></section>;
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
