import { useEffect, useMemo, useState } from "react";
import type { BackgroundBrief, BackgroundResult } from "../../schemas/background";
import type { ContentType } from "../../schemas/content";
import type { ComparisonResult } from "../../schemas/comparison";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import type { SvgCandidate } from "../../schemas/svg";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { runCompareWorkflow } from "../../workflows/compareWorkflow";
import { runFinishWorkflow } from "../../workflows/finishWorkflow";
import { buildProjectData } from "../projectBuilder";
import { ActionBar } from "../components/ActionBar";
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
  onBackground: (result: BackgroundResult) => void;
};

const demoSvgA = `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" rx="24" fill="#f6f8f7"/><rect x="28" y="28" width="744" height="394" rx="20" fill="#fff" stroke="#cfe0d8"/><text x="64" y="150" font-size="58" font-weight="800" fill="#1f6f5b" font-family="Inter, sans-serif">AI活用</text><text x="64" y="222" font-size="54" font-weight="800" fill="#0f172a" font-family="Inter, sans-serif">何から始める？</text><text x="64" y="286" font-size="24" font-weight="700" fill="#334155" font-family="Inter, sans-serif">明日試せる実践ステップを60分で整理</text><rect x="548" y="348" width="190" height="52" rx="26" fill="#237a4b"/><text x="643" y="381" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="Inter, sans-serif">無料で参加する</text></svg>`;
const demoSvgB = `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" rx="24" fill="#ecfdf5"/><rect x="30" y="30" width="740" height="390" rx="20" fill="#fff" stroke="#bbf7d0"/><text x="64" y="145" font-size="50" font-weight="800" fill="#064e3b" font-family="Inter, sans-serif">60分でわかる</text><text x="64" y="220" font-size="62" font-weight="800" fill="#16a34a" font-family="Inter, sans-serif">AI活用の第一歩</text><text x="64" y="286" font-size="24" font-weight="700" fill="#334155" font-family="Inter, sans-serif">現場で使える知識と具体例をわかりやすく解説</text><rect x="548" y="348" width="190" height="52" rx="26" fill="#16a34a"/><text x="643" y="381" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="Inter, sans-serif">無料で参加する</text></svg>`;

export function CompareScreen({ providers, projectData, onProjectData, onComparison, onBackground }: CompareScreenProps) {
  const [contentType, setContentType] = useState<ContentType>(projectData?.contentType ?? "seminar_banner");
  const [frames, setFrames] = useState<FigmaFrameData[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | undefined>();
  const [backgroundBrief, setBackgroundBrief] = useState<BackgroundBrief | undefined>();
  const [backgroundResult, setBackgroundResult] = useState<BackgroundResult | undefined>(projectData?.backgroundResult);
  const [statusLogs, setStatusLogs] = useState<string[]>(["自動制作後の比較確認画面です。必要に応じてFigma上の2〜5案を選択し、比較を再実行できます。"]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);

  const activeComparison = comparison ?? projectData?.comparisonResult;
  const display = useMemo(() => buildCompareDisplay(activeComparison, projectData?.svgCandidates ?? [], frames, contentType), [activeComparison, projectData?.svgCandidates, frames, contentType]);
  const editableBrief = backgroundBrief ?? activeComparison?.backgroundBrief ?? display.brief;

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
      setBackgroundBrief(result.backgroundBrief);
      onComparison(result);
      if (projectData) {
        onProjectData(buildProjectData({ ...projectDataToBuilder(projectData), comparisonResult: result }));
      }
      setError(null);
      setStatusLogs((entries) => [...entries, result.providerMeta?.fallbackUsed ? "API未設定の工程を代替処理で比較しました。" : "比較が完了しました。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "比較に失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsComparing(false);
    }
  }

  async function handleCompareGeneratedCandidates() {
      if (!projectData?.svgCandidates.length) {
      setError("評価する5案がまだありません。制作タブで5案SVGまで生成するか、Figma上で2〜5案を選択してください。");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsComparing(true);
    setStatusLogs(["生成済み5案を評価しています。"]);
    await runComparison(createAutoCompareFrames(projectData), projectData.contentType);
  }

  async function handleGenerateBackground() {
    if (!editableBrief) return;
    setError(null);
    setSuccess(null);
    setIsGeneratingBackground(true);
    setStatusLogs((entries) => [...entries, "確認済みの背景ブリーフで背景生成を開始します。"]);
    try {
      const result = await runFinishWorkflow(editableBrief);
      setBackgroundResult(result);
      onBackground(result);
      if (projectData) {
        const updated = buildProjectData({
          ...projectDataToBuilder(projectData),
          comparisonResult: activeComparison,
          backgroundResult: result,
          productionStatus: projectData.productionStatus,
          figmaOutputs: upsertFigmaOutput(projectData.figmaOutputs ?? [], "background_variations"),
        });
        onProjectData(updated);
      }
      postToPlugin({ type: "RENDER_FINISH_BOARD", payload: { backgroundResult: result, comparisonResult: activeComparison } });
      setSuccess("背景案を生成し、Figmaに記録しました。");
      setStatusLogs((entries) => [...entries, result.providerMeta?.fallbackUsed ? "代替処理で背景案を生成しました。" : "背景案の生成が完了しました。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "背景生成に失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsGeneratingBackground(false);
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
          <p className="eyebrow">Content Production Board <span className="step-pill">Sub Tool</span></p>
          <h2>評価</h2>
          <p>選択フレームや制作済み案を、採用判断に使える粒度で比較します。</p>
        </div>
        <div className="badge-row">
          <ProviderBadge label="接続先" provider={activeComparison?.providerMeta?.provider ?? providers.compare} fallbackUsed={activeComparison?.providerMeta?.fallbackUsed} />
        </div>
      </div>

      <div className="review-layout compare-review-layout">
        <section className="panel review-side-panel">
          <SectionHeader title="比較対象" description="見た目の好みではなく、役割と用途の違いを確認します。" />
          <CompareTargetCard label="案A" item={display.a} badge="ベース候補" />
          <CompareTargetCard label="案B" item={display.b} badge="次点候補" />
          <ChecklistCard title="比較の観点" items={["最初に伝わること", "申込導線", "情報量", "背景を足す余地", "ベース候補", "次点候補"]} />
          <ChecklistCard title="出力される判断材料" items={["役割の違い", "向いている用途", "懸念点", "背景生成ブリーフ"]} completed />
          <PresetSelector value={contentType} onChange={setContentType} />
        </section>

        <section className="panel review-main-panel">
          <SectionHeader title="比較サマリー" description={`比較時間: ${display.createdAt} / 接続先: ${display.provider}`} />
          {(isComparing || isGeneratingBackground) && (
            <LoadingState
              title={isGeneratingBackground ? "背景を生成しています" : "複数案を比較しています"}
              description={isGeneratingBackground ? "確認済みの背景ブリーフをもとに背景案を生成しています。" : "役割、強み、懸念、背景生成ブリーフを整理しています。"}
            />
          )}
          {error && <ErrorMessage title="比較を実行できませんでした" detail={error} action="Figma上で2〜5案を選択して、もう一度実行してください。" />}
          {success && <SuccessMessage title={success} />}
          <InsightHero text={display.summary} />
          <ComparisonMatrix rows={display.rows} />
          <div className="insight-grid two">
            <CandidateReasonCard title="ベース候補" item={display.primary} />
            <CandidateReasonCard title="次点候補" item={display.secondary} />
          </div>
          <BackgroundBriefEditor brief={editableBrief} onChange={setBackgroundBrief} generated={Boolean(backgroundResult)} />
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
          <button className="ghost-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent("CHANGE_APP_TAB", { detail: "Explore" }))}>制作結果へ戻る</button>
        </div>
        <div className="action-group action-group-center">
          <button className="secondary-button" type="button" onClick={handleRenderCompareBoard}>比較ボードをFigmaに出力</button>
          <button className="secondary-button" type="button" onClick={handleCopyReport}>レポートをコピー</button>
        </div>
        <div className="action-group action-group-right">
          <button className="secondary-button" type="button" disabled={isComparing} onClick={() => void handleCompareGeneratedCandidates()}>
            {isComparing ? "評価中..." : "生成済み5案を評価"}
          </button>
          <button className="primary-button" type="button" onClick={handleCompareSelectedFrames}>{isComparing ? "比較中..." : "選択案を比較"}</button>
          <button className="primary-button" type="button" disabled={isGeneratingBackground} onClick={() => void handleGenerateBackground()}>
            {isGeneratingBackground ? "背景生成中..." : "背景を生成して記録"}
          </button>
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
  const primaryCandidate = result ? candidates.find((candidate) => candidate.id === result.recommendation.primaryFrameId) : candidates[0];
  const secondaryCandidate = result?.recommendation.secondaryFrameId
    ? candidates.find((candidate) => candidate.id === result.recommendation.secondaryFrameId)
    : candidates.find((candidate) => candidate.id !== primaryCandidate?.id);
  const primaryFrame = result ? result.frames.find((frame) => frame.id === result.recommendation.primaryFrameId) : frames[0];
  const secondaryFrame = result?.recommendation.secondaryFrameId ? result.frames.find((frame) => frame.id === result.recommendation.secondaryFrameId) : frames.find((frame) => frame.id !== primaryFrame?.id);
  const a = candidateToItem(primaryCandidate ?? candidates[0], primaryFrame ?? frames[0], "AI活用 何から始める？", demoSvgA);
  const b = candidateToItem(secondaryCandidate ?? candidates[1], secondaryFrame ?? frames[1], "60分でわかる AI活用の第一歩", demoSvgB);
  const roles = result?.frameRoles ?? [];
  return {
    a,
    b,
    summary:
      result?.comparisonSummary ??
      "案Aは課題に気づかせる入口、案Bは参加後の価値を説明する補強案です。初回接点では案Aをベースにし、背景で信頼感を足す方針にします。",
    rows:
      roles.length > 0
        ? roles.map((role) => ({ name: role.frameName, role: role.role, bestFor: role.bestFor, strength: role.strength, concern: role.risk }))
        : [
            { name: a.name, role: "課題想起・入口", bestFor: "SNS告知やLPファーストビュー", strength: "問いかけで自分ごと化しやすい", concern: "内容の具体性はサブコピーで補いたい" },
            { name: b.name, role: "参加メリット・内容訴求", bestFor: "メール告知や申込直前の訴求", strength: "時間と得られる内容が明確", concern: "新規接点では少し説明的に見える" },
          ],
    primary: { name: result ? findFrameName(result, result.recommendation.primaryFrameId) : a.name, reason: result?.recommendation.primaryReason ?? "初回接点で不安を言語化でき、初心者層のクリック理由を作りやすいためベース候補に向いています。" },
    secondary: { name: result?.recommendation.secondaryFrameId ? findFrameName(result, result.recommendation.secondaryFrameId) : b.name, reason: result?.recommendation.secondaryReason ?? "得られる内容を補足する案として、LP内やリマインド告知に転用しやすいです。" },
    brief: result?.backgroundBrief ?? demoBrief(a.id, a.name, contentType),
    provider: result?.providerMeta?.provider === "demo" ? "代替処理" : result?.providerMeta?.provider ?? "代替処理",
    createdAt: result ? new Date(result.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "未実行",
  };
}

function candidateToItem(candidate: SvgCandidate | undefined, frame: FigmaFrameData | undefined, fallbackName: string, fallbackSvg: string): CompareDisplayItem {
  const name = candidate?.name ?? frame?.name ?? fallbackName;
  return {
    id: candidate?.id ?? frame?.id ?? fallbackName,
    name,
    svg: candidate?.svg ?? fallbackSvg,
    meta: [["タイプ", "セミナーバナー"], ["用途", "集客・告知"], ["トーン", name.includes("60分") ? "安心感・わかりやすさ" : "課題共感・親しみやすさ"]],
  };
}

function demoBrief(targetFrameId: string, targetFrameName: string, contentType: ContentType): BackgroundBrief {
  return {
    id: "demo-brief-compare",
    contentType,
    targetFrameId,
    targetFrameName,
    mood: "calm / trustworthy / approachable",
    style: "quiet tech texture with soft depth and restrained geometry",
    avoid: ["文字の生成", "ロゴ", "過度な装飾", "中央の細かすぎる模様", "派手なネオン表現"],
    safeAreaHint: "主見出しとCTAの背面は低コントラストにし、文字領域を邪魔しない。",
    suggestedStyleKeywords: ["quiet tech texture", "business calm", "low contrast center", "soft depth"],
    promptText: "初心者が安心して一歩を踏み出せるよう、文字領域を空けた落ち着いたテック系背景で構成する。",
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

function BackgroundBriefEditor({ brief, onChange, generated }: { brief: BackgroundBrief; onChange: (brief: BackgroundBrief) => void; generated: boolean }) {
  function updateField<K extends keyof BackgroundBrief>(key: K, value: BackgroundBrief[K]) {
    onChange({ ...brief, [key]: value });
  }

  function updateList(key: "avoid" | "suggestedStyleKeywords", value: string) {
    onChange({
      ...brief,
      [key]: value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    });
  }

  return (
    <section className="review-card background-brief-editor">
      <div className="brief-editor-header">
        <h3>背景生成ブリーフ</h3>
        <span className={generated ? "mini-badge complete" : "mini-badge"}>{generated ? "生成済み" : "生成前確認"}</span>
      </div>
      <label className="field">
        <span>背景の狙い</span>
        <textarea value={brief.promptText} onChange={(event) => updateField("promptText", event.target.value)} />
      </label>
      <div className="background-brief-grid">
        <label className="field">
          <span>雰囲気</span>
          <input value={brief.mood} onChange={(event) => updateField("mood", event.target.value)} />
        </label>
        <label className="field">
          <span>スタイル</span>
          <input value={brief.style} onChange={(event) => updateField("style", event.target.value)} />
        </label>
      </div>
      <label className="field">
        <span>文字領域への配慮</span>
        <textarea value={brief.safeAreaHint} onChange={(event) => updateField("safeAreaHint", event.target.value)} />
      </label>
      <div className="background-brief-grid">
        <label className="field">
          <span>避けること</span>
          <textarea value={brief.avoid.join("\n")} onChange={(event) => updateList("avoid", event.target.value)} />
        </label>
        <label className="field">
          <span>キーワード</span>
          <textarea value={brief.suggestedStyleKeywords.join("\n")} onChange={(event) => updateList("suggestedStyleKeywords", event.target.value)} />
        </label>
      </div>
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
  const visibleItems = items.filter(([label, value]) => !label.includes("サイズ") && !label.includes("繧ｵ") && !value.includes("800"));
  return <dl className="review-info-list">{visibleItems.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function ChecklistCard({ title, items, completed = false }: { title: string; items: string[]; completed?: boolean }) {
  return <section className="review-card"><h3>{title}</h3><ul className="review-check-list">{items.map((item) => <li key={item}><span className={completed ? "check-dot done" : "check-dot"}>{completed ? "✓" : ""}</span>{item}</li>)}</ul></section>;
}

function InsightHero({ text }: { text: string }) {
  return <section className="insight-hero"><span aria-hidden="true">i</span><strong>{text}</strong></section>;
}

function CompatibilityCard({ rows }: { rows: [string, string][] }) {
  return <section className="review-card"><h3>用途との相性</h3><ul className="compat-list">{rows.map(([label, value]) => <li key={label}><span>{label}</span><strong>{value}</strong></li>)}</ul></section>;
}

function findFrameName(result: ComparisonResult, frameId: string): string {
  return result.frames.find((frame) => frame.id === frameId)?.name ?? frameId;
}

function createAutoCompareFrames(project: ProjectData): FigmaFrameData[] {
  return project.svgCandidates.map((candidate, index) => {
    const title = candidate.name;
    const subtitle = project.copyDirections.find((direction) => direction.id === candidate.directionId)?.title ?? project.inputSummary.brief;
    const cta = project.contentType === "seminar_banner" ? "詳細を見る" : "";
    const textNodes = [
      createTextNode(`${candidate.id}_title`, "Title", title, 56, 86, 540, 70, 44),
      createTextNode(`${candidate.id}_subtitle`, "Subtitle", subtitle, 58, 170, 620, 52, 22),
      cta ? createTextNode(`${candidate.id}_cta`, "CTA", cta, 560, 352, 140, 32, 16) : undefined,
    ].filter((node): node is FigmaFrameData["textNodes"][number] => Boolean(node));

    return {
      id: candidate.id,
      name: candidate.name || `生成案 ${index + 1}`,
      x: 0,
      y: index * 500,
      width: candidate.width,
      height: candidate.height,
      textNodes,
      shapeNodes: [],
      derived: {
        textCount: textNodes.length,
        shapeCount: 0,
        totalTextChars: textNodes.reduce((sum, node) => sum + node.characters.length, 0),
        maxFontSize: Math.max(...textNodes.map((node) => node.fontSize ?? 0)),
        minFontSize: Math.min(...textNodes.map((node) => node.fontSize ?? 999)),
        colors: [],
        colorCount: 0,
        elementDensity: textNodes.length / (candidate.width * candidate.height),
        frameSizeMatchesCanvas: true,
        possibleMainTitle: textNodes[0],
        possibleCTA: cta ? textNodes[textNodes.length - 1] : undefined,
        possibleDate: undefined,
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
    fontName: "Inter",
    fontFamily: "Inter",
    fills: [{ type: "SOLID", color: "#111827", opacity: 1 }],
    color: "#111827",
    opacity: 1,
    visible: true,
  };
}

function upsertFigmaOutput(outputs: ProjectData["figmaOutputs"], stage: "background_variations"): NonNullable<ProjectData["figmaOutputs"]> {
  return [...(outputs ?? []).filter((output) => output.stage !== stage), { stage, placedAt: new Date().toISOString(), status: "placed" }];
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
