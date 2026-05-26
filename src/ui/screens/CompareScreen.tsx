import { useEffect, useMemo, useState } from "react";
import type { BackgroundBrief } from "../../schemas/background";
import type { ContentType } from "../../schemas/content";
import type { ComparisonResult } from "../../schemas/comparison";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import type { SvgCandidate } from "../../schemas/svg";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { runCompareWorkflow } from "../../workflows/compareWorkflow";
import { buildProjectData } from "../projectBuilder";
import { ActionBar } from "../components/ActionBar";
import { CanvasBadge } from "../components/CanvasBadge";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { PresetSelector } from "../components/PresetSelector";
import { ProviderBadge } from "../components/ProviderBadge";
import { SectionHeader } from "../components/SectionHeader";
import { StatusLog } from "../components/StatusLog";
import { SuccessMessage } from "../components/SuccessMessage";

type CompareScreenProps = {
  providers: ProviderConfig;
  projectData: ProjectData | null;
  onProjectData: (project: ProjectData) => void;
  onComparison: (result: ComparisonResult) => void;
  onSendToFinish: (brief: BackgroundBrief) => void;
};

const demoSvgA = `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" rx="24" fill="#eff6ff"/><rect x="28" y="28" width="744" height="394" rx="20" fill="#fff" stroke="#bfdbfe"/><text x="64" y="150" font-size="58" font-weight="800" fill="#1d4ed8" font-family="Inter, sans-serif">AI活用</text><text x="64" y="222" font-size="54" font-weight="800" fill="#0f172a" font-family="Inter, sans-serif">何から始める？</text><text x="64" y="286" font-size="24" font-weight="700" fill="#334155" font-family="Inter, sans-serif">明日から使える実践ステップを60分で解説</text><rect x="548" y="348" width="190" height="52" rx="26" fill="#16a34a"/><text x="643" y="381" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="Inter, sans-serif">無料で参加する</text></svg>`;
const demoSvgB = `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" rx="24" fill="#ecfdf5"/><rect x="30" y="30" width="740" height="390" rx="20" fill="#fff" stroke="#bbf7d0"/><text x="64" y="145" font-size="50" font-weight="800" fill="#064e3b" font-family="Inter, sans-serif">60分でわかる</text><text x="64" y="220" font-size="62" font-weight="800" fill="#16a34a" font-family="Inter, sans-serif">AI活用の第一歩</text><text x="64" y="286" font-size="24" font-weight="700" fill="#334155" font-family="Inter, sans-serif">現場で使える知識と具体例をわかりやすく解説</text><rect x="548" y="348" width="190" height="52" rx="26" fill="#16a34a"/><text x="643" y="381" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="Inter, sans-serif">無料で参加する</text></svg>`;

export function CompareScreen({ providers, projectData, onProjectData, onComparison, onSendToFinish }: CompareScreenProps) {
  const [contentType, setContentType] = useState<ContentType>(projectData?.contentType ?? "seminar_banner");
  const [frames, setFrames] = useState<FigmaFrameData[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | undefined>();
  const [statusLogs, setStatusLogs] = useState<string[]>(["自動制作後の比較確認画面です。必要に応じてFigma上の2〜5案を選択し、比較を再実行できます。"]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  const activeComparison = comparison ?? projectData?.comparisonResult;
  const display = useMemo(() => buildCompareDisplay(activeComparison, projectData?.svgCandidates ?? [], frames, contentType), [activeComparison, projectData?.svgCandidates, frames, contentType]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ pluginMessage?: PluginResponseMessage }>) => {
      const message = event.data.pluginMessage;
      if (!message) return;
      if (message.type === "SELECTION_FRAMES_RESULT") {
        setFrames(message.payload);
        setStatusLogs((entries) => [...entries, `${message.payload.length}案を取得しました。`, "各案の役割と向いている用途を整理しています。"]);
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
      if (projectData) {
        onProjectData(buildProjectData({ ...projectDataToBuilder(projectData), comparisonResult: result }));
      }
      setError(null);
      setStatusLogs((entries) => [...entries, result.providerMeta?.fallbackUsed ? "API未設定のためDemo比較で続行しました。" : "比較が完了しました。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "比較に失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsComparing(false);
    }
  }

  function handleRenderCompareBoard() {
    if (!activeComparison) {
      setError("比較ボードをFigmaに出力するには、先に比較を実行してください。");
      return;
    }
    postToPlugin({ type: "RENDER_COMPARE_BOARD", payload: activeComparison });
  }

  function handleCopyReport() {
    const text = [`比較概要: ${display.summary}`, `ベース候補: ${display.primary.name}`, `理由: ${display.primary.reason}`, `次点候補: ${display.secondary.name}`].join("\n");
    void navigator.clipboard?.writeText(text);
    setSuccess("比較レポートをコピーしました。");
  }

  return (
    <div className="review-screen">
      <div className="review-page-heading">
        <div>
          <p className="eyebrow">AI CREATIVE PROCESS BOARD <span className="step-pill">Step 3/4</span></p>
          <h2>比較</h2>
          <p>2〜5案を比べ、ベース候補と次点候補、background briefを整理します。</p>
        </div>
        <div className="badge-row">
          <CanvasBadge />
          <span className="provider-badge warning">実行モード: Demo Mode</span>
          <ProviderBadge label="provider" provider={activeComparison?.providerMeta?.provider ?? providers.compare} fallbackUsed={activeComparison?.providerMeta?.fallbackUsed} />
        </div>
      </div>

      <div className="review-layout compare-review-layout">
        <section className="panel review-side-panel">
          <SectionHeader title="比較対象" description="選択中または自動制作済みの案を比較しています。" />
          <CompareTargetCard label="案A" item={display.a} badge="ベース候補" />
          <CompareTargetCard label="案B" item={display.b} badge="次点候補" />
          <ChecklistCard title="比較の観点" items={["役割", "向いている用途", "強い点", "懸念", "ベース候補", "次点候補"]} />
          <ChecklistCard title="処理の流れ" items={["2案を取得", "差分を抽出", "コメント生成", "ベース候補整理"]} completed />
          <PresetSelector value={contentType} onChange={setContentType} />
        </section>

        <section className="panel review-main-panel">
          <SectionHeader title="比較サマリー" description={`比較時間: ${display.createdAt} / provider: ${display.provider}`} />
          {isComparing && <LoadingState title="複数案を比較しています" description="役割、強み、懸念、背景生成briefを整理しています。" />}
          {error && <ErrorMessage title="比較を実行できませんでした" detail={error} action="Figma上で2〜5案を選択して、もう一度実行してください。" />}
          {success && <SuccessMessage title={success} />}
          <InsightHero text={display.summary} />
          <ComparisonMatrix rows={display.rows} />
          <div className="insight-grid two">
            <CandidateReasonCard title="ベース候補" item={display.primary} />
            <CandidateReasonCard title="次点候補" item={display.secondary} />
          </div>
          <BriefCard brief={display.brief} />
        </section>

        <section className="panel review-preview-panel">
          <SectionHeader title="比較プレビュー" />
          <PreviewFigure svg={display.a.svg} label="案A / ベース候補" large />
          <PreviewFigure svg={display.b.svg} label="案B / 次点候補" large />
          <ComparisonWinnerCard />
          <CompatibilityCard rows={[["セミナー集客", "とても良い"], ["AI初心者向け", "とても良い"], ["忙しい人向け", "良い"], ["信頼感重視", "とても良い"]]} />
        </section>
      </div>

      <StatusLog entries={statusLogs.slice(-4)} />
      <ActionBar className="review-action-bar">
        <div className="action-group action-group-left">
          <button className="ghost-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent("CHANGE_APP_TAB", { detail: "Diagnose" }))}>診断に戻る</button>
        </div>
        <div className="action-group action-group-center">
          <button className="secondary-button" type="button" onClick={handleRenderCompareBoard}>比較ボードをFigmaに出力</button>
          <button className="secondary-button" type="button" onClick={handleCopyReport}>レポートをコピー</button>
        </div>
        <div className="action-group action-group-right">
          <button className="primary-button" type="button" onClick={handleCompareSelectedFrames}>{isComparing ? "比較中..." : "選択案を比較"}</button>
          <button className="primary-button" type="button" onClick={() => onSendToFinish(display.brief)}>仕上げへ進む</button>
        </div>
      </ActionBar>
    </div>
  );
}

type CompareDisplayItem = { id: string; name: string; svg: string; meta: [string, string][]; reason?: string };
type CompareDisplay = {
  a: CompareDisplayItem;
  b: CompareDisplayItem;
  summary: string;
  rows: { name: string; role: string; bestFor: string; strength: string; concern: string }[];
  primary: { name: string; reason: string };
  secondary: { name: string; reason: string };
  brief: BackgroundBrief;
  provider: string;
  createdAt: string;
};

function buildCompareDisplay(result: ComparisonResult | undefined, candidates: SvgCandidate[], frames: FigmaFrameData[], contentType: ContentType): CompareDisplay {
  const a = candidateToItem(candidates[0], frames[0], "AI活用 何から始める？", demoSvgA);
  const b = candidateToItem(candidates[1], frames[1], "60分でわかる AI活用の第一歩", demoSvgB);
  const roles = result?.frameRoles ?? [];
  return {
    a,
    b,
    summary:
      result?.comparisonSummary ??
      "課題共感型は集客向き、参加メリット型は内容理解向き。今回は入口として強い「AI活用、何から始める？」をベース候補とします。",
    rows:
      roles.length > 0
        ? roles.map((role) => ({ name: role.frameName, role: role.role, bestFor: role.bestFor, strength: role.strength, concern: role.risk }))
        : [
            { name: a.name, role: "課題想起・入口", bestFor: "セミナー集客の入口", strength: "問いかけで関心を引きやすい", concern: "内容イメージがやや曖昧" },
            { name: b.name, role: "参加メリット・内容訴求", bestFor: "理解促進の告知", strength: "時間と内容が明確で安心感がある", concern: "入口としてのインパクトは控えめ" },
          ],
    primary: { name: result ? findFrameName(result, result.recommendation.primaryFrameId) : a.name, reason: result?.recommendation.primaryReason ?? "入口として強く、初心者層の関心を引きやすいためベース候補に向いています。" },
    secondary: { name: result?.recommendation.secondaryFrameId ? findFrameName(result, result.recommendation.secondaryFrameId) : b.name, reason: result?.recommendation.secondaryReason ?? "内容理解と安心感の補強として残す価値があります。" },
    brief: result?.backgroundBrief ?? demoBrief(a.id, a.name, contentType),
    provider: result?.providerMeta?.provider ?? "demo",
    createdAt: result ? new Date(result.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "Demo",
  };
}

function candidateToItem(candidate: SvgCandidate | undefined, frame: FigmaFrameData | undefined, fallbackName: string, fallbackSvg: string): CompareDisplayItem {
  const name = candidate?.name ?? frame?.name ?? fallbackName;
  return {
    id: candidate?.id ?? frame?.id ?? fallbackName,
    name,
    svg: candidate?.svg ?? fallbackSvg,
    meta: [["サイズ", "800×450 固定"], ["タイプ", "セミナーバナー"], ["用途", "集客・告知"], ["トーン", name.includes("60分") ? "安心感・わかりやすさ" : "課題共感・親しみやすさ"]],
  };
}

function demoBrief(targetFrameId: string, targetFrameName: string, contentType: ContentType): BackgroundBrief {
  return {
    id: "demo-brief-compare",
    contentType,
    targetFrameId,
    targetFrameName,
    mood: "calm / trustworthy / friendly",
    style: "soft tech gradient with subtle geometry",
    avoid: ["文字の生成", "ロゴ", "過度な装飾", "中央の細かすぎる模様"],
    safeAreaHint: "主見出しとCTAの背面は低コントラストにし、文字領域を邪魔しない。",
    suggestedStyleKeywords: ["soft tech gradient", "business calm", "low contrast center"],
    promptText: "初心者が安心して一歩を踏み出せる、信頼感と親しみのある背景で構成する。",
  };
}

function CompareTargetCard({ label, item, badge }: { label: string; item: CompareDisplayItem; badge: string }) {
  return (
    <article className="review-card target-card">
      <PreviewFigure svg={item.svg} label={label} />
      <div>
        <strong>{item.name}</strong>
        <span className="mini-badge">{badge}</span>
      </div>
      <InfoList items={item.meta} />
    </article>
  );
}

function ComparisonMatrix({ rows }: { rows: CompareDisplay["rows"] }) {
  return (
    <div className="review-table-wrap">
      <table className="review-table">
        <thead><tr><th>案</th><th>役割</th><th>向いている用途</th><th>強み</th><th>懸念</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row.name}><td>{row.name}</td><td>{row.role}</td><td>{row.bestFor}</td><td>{row.strength}</td><td>{row.concern}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function CandidateReasonCard({ title, item }: { title: string; item: { name: string; reason: string } }) {
  return <article className="insight-card"><h3>{title}</h3><strong>{item.name}</strong><p>{item.reason}</p></article>;
}

function BriefCard({ brief }: { brief: BackgroundBrief }) {
  return (
    <section className="review-card brief-card">
      <h3>background brief</h3>
      <InfoList items={[["背景の方向性", brief.promptText], ["雰囲気", brief.mood], ["背景スタイル", brief.style], ["避けること", brief.avoid.join(" / ")], ["文字領域への配慮", brief.safeAreaHint]]} />
    </section>
  );
}

function ComparisonWinnerCard() {
  const rows: [string, string, number][] = [["伝わりやすさ", "案A", 88], ["情報の整理", "案B", 84], ["視線誘導", "案A", 76], ["行動につながりやすさ", "案B", 82]];
  return <section className="review-card"><h3>比較結果</h3><div className="metric-list">{rows.map(([label, value, width]) => <div className="metric-row" key={label}><span>{label}</span><div><i style={{ width: `${width}%` }} /></div><em>{value}</em></div>)}</div></section>;
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

function CompatibilityCard({ rows }: { rows: [string, string][] }) {
  return <section className="review-card"><h3>用途との相性</h3><ul className="compat-list">{rows.map(([label, value]) => <li key={label}><span>{label}</span><strong>{value}</strong></li>)}</ul></section>;
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
