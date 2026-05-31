import { useEffect, useMemo, useState } from "react";
import type { ContentType } from "../../schemas/content";
import type { DiagnosisResult } from "../../schemas/diagnosis";
import type { FigmaFrameData } from "../../schemas/figmaFrame";
import type { ProjectData } from "../../schemas/project";
import type { ProviderConfig } from "../../schemas/provider";
import type { SvgCandidate } from "../../schemas/svg";
import { postToPlugin, type PluginResponseMessage } from "../../plugin/figma/messageBridge";
import { runDiagnoseWorkflow } from "../../workflows/diagnoseWorkflow";
import { buildProjectData } from "../projectBuilder";
import { ActionBar } from "../components/ActionBar";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { PresetSelector } from "../components/PresetSelector";
import { ProviderBadge } from "../components/ProviderBadge";
import { SectionHeader } from "../components/SectionHeader";
import { StatusLog } from "../components/StatusLog";
import { SuccessMessage } from "../components/SuccessMessage";

type DiagnoseScreenProps = {
  providers: ProviderConfig;
  projectData: ProjectData | null;
  onProjectData: (project: ProjectData) => void;
  onDiagnosis: (result: DiagnosisResult) => void;
};

const demoSvg = `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"><rect width="800" height="450" rx="24" fill="#eff6ff"/><rect x="28" y="28" width="744" height="394" rx="20" fill="#fff" stroke="#bfdbfe"/><text x="64" y="148" font-size="58" font-weight="800" fill="#1d4ed8" font-family="Inter, sans-serif">AI活用、</text><text x="64" y="222" font-size="58" font-weight="800" fill="#0f172a" font-family="Inter, sans-serif">何から始める？</text><text x="64" y="286" font-size="24" font-weight="700" fill="#334155" font-family="Inter, sans-serif">明日から使える実践ステップを60分で整理</text><rect x="548" y="348" width="190" height="52" rx="26" fill="#16a34a"/><text x="643" y="381" text-anchor="middle" font-size="18" font-weight="800" fill="#fff" font-family="Inter, sans-serif">無料で参加する</text></svg>`;

export function DiagnoseScreen({ providers, projectData, onProjectData, onDiagnosis }: DiagnoseScreenProps) {
  const [contentType, setContentType] = useState<ContentType>(projectData?.contentType ?? "seminar_banner");
  const [selectedFrame, setSelectedFrame] = useState<FigmaFrameData | null>(null);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | undefined>();
  const [statusLogs, setStatusLogs] = useState<string[]>(["自動制作後の1案を確認する画面です。Figma上で選択したフレームも診断できます。"]);
  const [error, setError] = useState<string | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const latestDiagnosis = diagnosis ?? (projectData?.diagnosisResults.length ? projectData.diagnosisResults[projectData.diagnosisResults.length - 1] : undefined);
  const previewCandidate = projectData?.svgCandidates[0];
  const display = useMemo(() => buildDiagnosisDisplay(latestDiagnosis, selectedFrame, previewCandidate), [latestDiagnosis, selectedFrame, previewCandidate]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent<{ pluginMessage?: PluginResponseMessage }>) => {
      const message = event.data.pluginMessage;
      if (!message) return;
      if (message.type === "SELECTION_FRAME_RESULT") {
        setSelectedFrame(message.payload);
        setStatusLogs((entries) => [...entries, "選択中のフレームを取得しました。", "文字情報と構造を読み取っています。"]);
        void runDiagnosis(message.payload, contentType);
      }
      if (message.type === "PLUGIN_SUCCESS") {
        setSuccess(message.payload.message);
        setStatusLogs((entries) => [...entries, message.payload.message]);
      }
      if (message.type === "PLUGIN_ERROR") {
        setError(message.payload.message);
        setIsDiagnosing(false);
        setStatusLogs((entries) => [...entries, `Figmaエラー: ${message.payload.message}`]);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [contentType]);

  function handleDiagnoseSelectedFrame() {
    setError(null);
    setSuccess(null);
    setDiagnosis(undefined);
    setSelectedFrame(null);
    setIsDiagnosing(true);
    setStatusLogs(["選択中のフレームを取得しています。"]);
    postToPlugin({ type: "REQUEST_SELECTED_FRAME" });
  }

  async function runDiagnosis(frame: FigmaFrameData, preset: ContentType) {
    try {
      setStatusLogs((entries) => [...entries, `${preset === "note_thumbnail" ? "note" : "セミナー"}用途の観点で診断します。`, "診断コメントを生成しています。"]);
      const result = await runDiagnoseWorkflow(frame, preset);
      setDiagnosis(result);
      onDiagnosis(result);
      if (projectData) {
        onProjectData(buildProjectData({ ...projectDataToBuilder(projectData), diagnosisResults: [...projectData.diagnosisResults, result] }));
      }
      setError(null);
      setStatusLogs((entries) => [...entries, result.providerMeta?.fallbackUsed ? "API未設定のため代替処理で診断しました。" : "診断が完了しました。"]);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "診断に失敗しました。";
      setError(message);
      setStatusLogs((entries) => [...entries, message]);
    } finally {
      setIsDiagnosing(false);
    }
  }

  function handleRenderDiagnosisBoard() {
    if (!latestDiagnosis) {
      setError("診断ボードをFigmaに出力するには、先に診断を実行してください。");
      return;
    }
    postToPlugin({ type: "RENDER_DIAGNOSIS_BOARD", payload: latestDiagnosis });
  }

  function handleCopyReport() {
    const text = [`診断概要: ${display.summary}`, `最初に伝わること: ${display.firstImpression}`, `強い点: ${display.strengths.join(" / ")}`, `気になる点: ${display.concerns.join(" / ")}`].join("\n");
    void navigator.clipboard?.writeText(text);
    setSuccess("診断レポートをコピーしました。");
  }

  return (
    <div className="review-screen">
      <div className="review-page-heading">
        <div>
          <p className="eyebrow">Content Production Board</p>
          <h2>診断</h2>
          <p>生成済みの1案を読み取り、最初に伝わることと改善方針を整理します。</p>
        </div>
        <div className="badge-row">
          <ProviderBadge label="接続先" provider={latestDiagnosis?.providerMeta?.provider ?? providers.diagnosis} fallbackUsed={latestDiagnosis?.providerMeta?.fallbackUsed} />
        </div>
      </div>

      <div className="review-layout diagnose-review-layout">
        <section className="panel review-side-panel">
          <SectionHeader title="診断対象" description="Figma上で選択された1案を診断します。" />
          <PreviewFigure svg={display.svg} label={display.frameName} />
          <InfoList items={[["案名", display.frameName], ["ID", display.frameId], ["タイプ", "セミナーバナー"], ["用途", "集客・告知"], ["トーン", "信頼感・親しみやすさ"]]} />
          <ChecklistCard title="診断の観点" items={["最初に伝わること", "強い点", "気になる点", "最初に直すなら", "派生案のヒント"]} />
          <PresetSelector value={contentType} onChange={setContentType} />
        </section>

        <section className="panel review-main-panel">
          <SectionHeader title="診断サマリー" description="読む順番、伝わり方、修正優先度をまとめます。" />
          {isDiagnosing && <LoadingState title="フレームを診断しています" description="文字階層、余白、CTA、用途との相性を確認しています。" />}
          {error && <ErrorMessage title="診断を実行できませんでした" detail={error} action="Figma上でフレームを1つ選択して、もう一度実行してください。" />}
          {success && <SuccessMessage title={success} />}
          <div className="diagnosis-meta-line">
            <span>診断時間 {display.createdAt}</span>
            <span>接続先 {display.provider}</span>
          </div>
          <section className="diagnosis-summary-flow">
            <div className="diagnosis-lead">
              <span>概要</span>
              <p>{display.summary}</p>
            </div>
            <div className="diagnosis-first-read">
              <span>最初に伝わること</span>
              <p>{display.firstImpression}</p>
            </div>
            <div className="diagnosis-columns">
              <DiagnosisColumn title="強い点" items={display.strengths} />
              <DiagnosisColumn title="気になる点" items={display.concerns} tone="warn" />
            </div>
            <div className="diagnosis-next-grid">
              <NumberedList title="最初に直すなら" items={display.fixPriority} />
              <DiagnosisColumn title="派生案のヒント" items={display.rewriteIdeas} />
            </div>
          </section>
        </section>

        <section className="panel review-preview-panel">
          <SectionHeader title="選択中のプレビュー" />
          <PreviewFigure svg={display.svg} label="選択中バナー" large />
          <RatingCard title="総合評価" rows={[["伝わりやすさ", "良い", 88], ["情報の整理", "良い", 84], ["視線誘導", "改善余地あり", 68], ["行動につながりやすい", "良い", 82]]} />
          <CompatibilityCard rows={[["セミナー集客", "とても合う"], ["AI初心者向け", "とても合う"], ["忙しい人向け", "良い"], ["信頼感重視", "良い"]]} />
        </section>
      </div>

      <StatusLog entries={statusLogs.slice(-4)} />
      <ActionBar className="review-action-bar">
        <div className="action-group action-group-left">
          <button className="ghost-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent("CHANGE_APP_TAB", { detail: "Explore" }))}>探索に戻る</button>
        </div>
        <div className="action-group action-group-center">
          <button className="secondary-button" type="button" onClick={handleRenderDiagnosisBoard}>診断ボードをFigmaに出力</button>
          <button className="secondary-button" type="button" onClick={handleCopyReport}>レポートをコピー</button>
        </div>
        <div className="action-group action-group-right">
          <button className="primary-button" type="button" onClick={handleDiagnoseSelectedFrame}>{isDiagnosing ? "診断中..." : "選択フレームを診断"}</button>
          <button className="primary-button" type="button" onClick={() => window.dispatchEvent(new CustomEvent("CHANGE_APP_TAB", { detail: "Compare" }))}>比較へ進む</button>
        </div>
      </ActionBar>
    </div>
  );
}

type DiagnosisDisplay = {
  frameId: string;
  frameName: string;
  svg: string;
  summary: string;
  firstImpression: string;
  strengths: string[];
  concerns: string[];
  fixPriority: string[];
  rewriteIdeas: string[];
  provider: string;
  createdAt: string;
};

function buildDiagnosisDisplay(result: DiagnosisResult | undefined, frame: FigmaFrameData | null, candidate: SvgCandidate | undefined): DiagnosisDisplay {
  return {
    frameId: result?.frameId ?? frame?.id ?? candidate?.id ?? "SEC_01",
    frameName: result?.frameName ?? frame?.name ?? candidate?.name ?? "AI活用 何から始める？",
    svg: candidate?.svg ?? demoSvg,
    summary:
      result?.summary ??
      "AI活用に不安がある人へ、最初の一歩を後押しする印象です。初心者向けセミナーとして、入口の分かりやすさが強く出ています。",
    firstImpression: result?.firstImpression ?? "AI活用に迷っている人へ、やさしく参加を促すセミナー告知として伝わります。",
    strengths: result?.strengths ?? ["問いかけ型の見出しで関心を引きやすい", "CTAが明確で次の行動が分かる", "セミナー用途として必要な情報がまとまっている"],
    concerns: result?.concerns ?? ["日時情報が小さい場合は見落とされやすい", "具体的な参加メリットをもう少し補強できる", "右側に視線を逃がす要素があるとさらに安定します"],
    fixPriority: result?.fixPriority.map((item) => item.suggestion) ?? ["日時と開催形式を少し強調する", "「60分で学べる」をサブコピー内で目立たせる", "CTA周辺の余白を確保する", "背景装飾は文字領域から離す"],
    rewriteIdeas: result?.rewriteInstructions.map((item) => item.instruction) ?? [
      "AIのメリットを3つ並べて安心感を強調する構成",
      "「明日から使える」を目立たせる構成",
      "人物写真を追加して親近感を出す構成",
      "左右分割で右にビジュアルを置く構成",
    ],
    provider: result?.providerMeta?.provider === "demo" ? "代替処理" : result?.providerMeta?.provider ?? "代替処理",
    createdAt: result ? new Date(result.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) : "未実行",
  };
}

function PreviewFigure({ svg, label, large = false }: { svg: string; label: string; large?: boolean }) {
  return (
    <figure className={large ? "review-preview-figure large" : "review-preview-figure"}>
      <div className="review-svg-canvas" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>{label}</figcaption>
    </figure>
  );
}

function InfoList({ items }: { items: [string, string][] }) {
  return <dl className="review-info-list">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function ChecklistCard({ title, items }: { title: string; items: string[] }) {
  return <section className="review-card"><h3>{title}</h3><ul className="review-check-list">{items.map((item) => <li key={item}><span className="check-dot" />{item}</li>)}</ul></section>;
}

function DiagnosisColumn({ title, items, tone }: { title: string; items: string[]; tone?: "warn" }) {
  return (
    <section className={tone === "warn" ? "diagnosis-column warn" : "diagnosis-column"}>
      <h3>{title}</h3>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

function NumberedList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="diagnosis-column priority">
      <h3>{title}</h3>
      <ol>{items.map((item) => <li key={item}>{item}</li>)}</ol>
    </section>
  );
}

function RatingCard({ title, rows }: { title: string; rows: [string, string, number][] }) {
  return <section className="review-card"><h3>{title}</h3><div className="metric-list">{rows.map(([label, value, width]) => <div className="metric-row" key={label}><span>{label}</span><div><i style={{ width: `${width}%` }} /></div><em>{value}</em></div>)}</div></section>;
}

function CompatibilityCard({ rows }: { rows: [string, string][] }) {
  return <section className="review-card"><h3>用途との相性</h3><ul className="compat-list">{rows.map(([label, value]) => <li key={label}><span>{label}</span><strong>{value}</strong></li>)}</ul></section>;
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
    comparisonResult: project.comparisonResult,
    backgroundResult: project.backgroundResult,
  };
}
