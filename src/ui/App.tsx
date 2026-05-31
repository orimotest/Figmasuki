import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { providerConfig } from "../config/providers";
import { getRuntimeExecutionModeLabel, RUNTIME_API_SETTINGS_CHANGED_EVENT } from "../config/runtimeApiSettings";
import type { BackgroundResult } from "../schemas/background";
import type { ComparisonResult } from "../schemas/comparison";
import type { DiagnosisResult } from "../schemas/diagnosis";
import type { NormalizedCreativeInput } from "../schemas/input";
import type { ProcessBoardStage } from "../schemas/production";
import type { ProjectData } from "../schemas/project";
import type { ProviderConfig } from "../schemas/provider";
import { postToPlugin } from "../plugin/figma/messageBridge";
import { AppSidebar, type AppView, type AppViewStatus } from "./components/AppSidebar";
import { EmptyState } from "./components/EmptyState";
import { CompareScreen } from "./screens/CompareScreen";
import { DiagnoseScreen } from "./screens/DiagnoseScreen";
import { ExploreScreen } from "./screens/ExploreScreen";
import { FinishScreen } from "./screens/FinishScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

const appViews: AppView[] = ["Brief", "Markdown", "Auto", "Diagnose", "Compare", "Finish", "Output"];

const viewLabels: Record<Exclude<AppView, "Settings">, { label: string; pill: string; description: string }> = {
  Auto: {
    label: "自動制作",
    pill: "Main Flow",
    description: "要件からFinal Candidateまで、AIが段階的に制作します。",
  },
  Brief: {
    label: "要件入力",
    pill: "Input",
    description: "作りたいもの、テキスト、PDF、Figma参照を制作ブリーフへ整理します。",
  },
  Markdown: {
    label: "Markdown生成",
    pill: "Document",
    description: "Notion、ChatGPT、要件書の構造を読み取り、要件定義ボードにも残します。",
  },
  Diagnose: {
    label: "診断",
    pill: "Detail",
    description: "選択中または生成済みの1案を読み取り、改善方針を整理します。",
  },
  Compare: {
    label: "比較",
    pill: "Detail",
    description: "複数案の役割・強み・懸念を比較し、ベース候補を整理します。",
  },
  Finish: {
    label: "仕上げ",
    pill: "Detail",
    description: "Primary案に背景を加え、Final Candidateとして整えます。",
  },
  Output: {
    label: "Figma出力",
    pill: "Canvas",
    description: "Figmaに記録された工程ボードと成果物を確認します。",
  },
};

export default function App() {
  const [activeView, setActiveView] = useState<Exclude<AppView, "Settings">>("Brief");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | undefined>();
  const [background, setBackground] = useState<BackgroundResult | undefined>();
  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | undefined>();
  const [productionBrief, setProductionBrief] = useState<NormalizedCreativeInput | null>(null);
  const [executionMode, setExecutionMode] = useState<"API" | "Demo">(() => getRuntimeExecutionModeLabel());
  const providers: ProviderConfig = providerConfig;

  const outputCount = projectData?.figmaOutputs?.length ?? 0;
  const viewMeta = viewLabels[activeView];
  const navStatuses = useMemo<Partial<Record<AppView, AppViewStatus>>>(() => {
    const hasComparison = Boolean(comparison || projectData?.comparisonResult);
    const hasBackground = Boolean(background || projectData?.backgroundResult || projectData?.stageWorkflow?.finalCandidates?.length);
    return {
      Auto: projectData?.productionStatus?.stage === "error" ? "error" : projectData?.svgCandidates.length ? "done" : "idle",
      Brief: productionBrief || projectData ? "done" : "idle",
      Markdown: productionBrief?.inputSource === "markdown" || projectData?.inputMode === "markdown" ? "done" : "idle",
      Diagnose: diagnosis || projectData?.diagnosisResults.length ? "done" : "idle",
      Compare: hasComparison ? "done" : "idle",
      Finish: hasBackground ? "done" : "idle",
      Output: outputCount >= 7 ? "done" : "idle",
      Settings: executionMode === "API" ? "done" : "idle",
    };
  }, [projectData, productionBrief, comparison, background, diagnosis, outputCount, executionMode]);

  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const nextView = legacyTabToView((event as CustomEvent<string>).detail);
      if (nextView === "Settings") {
        setSettingsOpen(true);
        return;
      }
      if (nextView && appViews.includes(nextView)) setActiveView(nextView);
    };
    window.addEventListener("CHANGE_APP_TAB", handleTabChange);
    return () => window.removeEventListener("CHANGE_APP_TAB", handleTabChange);
  }, []);

  useEffect(() => {
    const refreshExecutionMode = () => setExecutionMode(getRuntimeExecutionModeLabel());
    window.addEventListener(RUNTIME_API_SETTINGS_CHANGED_EVENT, refreshExecutionMode);
    window.addEventListener("focus", refreshExecutionMode);
    return () => {
      window.removeEventListener(RUNTIME_API_SETTINGS_CHANGED_EVENT, refreshExecutionMode);
      window.removeEventListener("focus", refreshExecutionMode);
    };
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [settingsOpen]);

  function handleProjectData(project: ProjectData | null) {
    setProjectData(project);
    if (!project) {
      setComparison(undefined);
      setBackground(undefined);
      setDiagnosis(undefined);
      setProductionBrief(null);
    }
  }

  function handleRenderFullProcess() {
    if (!projectData) return;
    postToPlugin({ type: "RENDER_PROCESS_BOARD", payload: projectData });
  }

  function handleHeaderAction() {
    if (activeView === "Auto") {
      if (!productionBrief) {
        setActiveView("Brief");
        return;
      }
      window.dispatchEvent(new Event("START_AUTO_PRODUCTION"));
      return;
    }
    handleRenderFullProcess();
  }

  function handleSidebarChange(view: AppView) {
    if (view === "Settings") {
      setSettingsOpen(true);
      return;
    }
    setActiveView(view);
  }

  return (
    <main className="app-shell">
      <AppSidebar activeView={activeView} statuses={navStatuses} onChange={handleSidebarChange} />

      <section className="app-workspace">
        <header className="plugin-header app-header">
          <div className="header-copy">
            <p className="eyebrow">AI Creative Assistant Foundation</p>
            <h1>{viewMeta.label}</h1>
            <p className="header-description">
              <span className="step-pill">{viewMeta.pill}</span>
              {viewMeta.description}
            </p>
          </div>
          <div className="header-meta">
            {(activeView === "Auto" || activeView === "Output") && (
              <button className="header-button" type="button" disabled={activeView === "Output" && !projectData} onClick={handleHeaderAction}>
                {activeView === "Auto" ? (productionBrief ? "自動制作を開始" : "要件を入力") : "全工程をFigmaへ出力"}
              </button>
            )}
          </div>
        </header>

        <section className="plugin-scroll-area nice-scrollbar scroll-fade-bottom screen-area">
          {activeView === "Auto" && (
            <ExploreScreen
              phase="production"
              providers={providers}
              projectData={projectData}
              productionBrief={productionBrief}
              onProductionBrief={setProductionBrief}
              onProceedToProduction={() => setActiveView("Auto")}
              onProjectData={handleProjectData}
            />
          )}
          {activeView === "Brief" && (
            <ExploreScreen
              phase="brief"
              providers={providers}
              projectData={projectData}
              productionBrief={productionBrief}
              onProductionBrief={setProductionBrief}
              onProceedToProduction={() => setActiveView("Auto")}
              onProjectData={handleProjectData}
            />
          )}
          {activeView === "Markdown" && (
            <ExploreScreen
              phase="brief"
              forcedInputMode="markdown"
              providers={providers}
              projectData={projectData}
              productionBrief={productionBrief}
              onProductionBrief={setProductionBrief}
              onProceedToProduction={() => setActiveView("Auto")}
              onProjectData={handleProjectData}
            />
          )}
          {activeView === "Diagnose" && <DiagnoseScreen providers={providers} projectData={projectData} onProjectData={setProjectData} onDiagnosis={setDiagnosis} />}
          {activeView === "Compare" && <CompareScreen providers={providers} projectData={projectData} onProjectData={setProjectData} onComparison={setComparison} onBackground={setBackground} />}
          {activeView === "Finish" && (
            <FinishScreen
              providers={providers}
              backgroundBrief={comparison?.backgroundBrief ?? projectData?.comparisonResult?.backgroundBrief ?? null}
              comparisonResult={comparison ?? projectData?.comparisonResult}
              projectData={projectData}
              onProjectData={setProjectData}
              onBackground={setBackground}
            />
          )}
          {activeView === "Output" && <FigmaOutputView projectData={projectData} onRenderFullProcess={handleRenderFullProcess} />}
        </section>
      </section>

      {settingsOpen && (
        <div className="settings-drawer-layer" role="presentation">
          <button className="settings-drawer-backdrop" type="button" aria-label="設定を閉じる" onClick={() => setSettingsOpen(false)} />
          <aside className="settings-drawer" role="dialog" aria-modal="true" aria-label="API設定">
            <div className="settings-drawer-header">
              <div>
                <p className="eyebrow">Connection Settings</p>
                <h2>API設定</h2>
              </div>
              <button className="icon-button" type="button" aria-label="設定を閉じる" onClick={() => setSettingsOpen(false)}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <SettingsScreen compact />
          </aside>
        </div>
      )}
    </main>
  );
}

function legacyTabToView(value: string | undefined): AppView | null {
  if (!value) return null;
  if (value === "Explore") return "Auto";
  if (value === "Brief") return "Brief";
  if (value === "Markdown") return "Markdown";
  if (value === "Compare") return "Compare";
  if (value === "Diagnose") return "Diagnose";
  if (value === "Finish") return "Finish";
  if (value === "Output") return "Output";
  if (value === "Settings") return "Settings";
  return null;
}

function FigmaOutputView({ projectData, onRenderFullProcess }: { projectData: ProjectData | null; onRenderFullProcess: () => void }) {
  const outputs = projectData?.figmaOutputs ?? [];
  const stages: ProcessBoardStage[] = ["project_header", "ideas", "typography_drafts", "refined_svgs", "compare", "background_variations", "final_candidate"];
  return (
    <div className="output-layout">
      <section className="panel output-main-panel">
        <div className="review-page-heading">
          <div>
            <p className="eyebrow">Canvas Records</p>
            <h2>Figma出力</h2>
            <p>工程ボード、5案、背景3案、Final CandidateがFigma上で追える状態か確認します。</p>
          </div>
          <button className="primary-button" type="button" disabled={!projectData} onClick={onRenderFullProcess}>
            全工程をFigmaへ出力
          </button>
        </div>
        {projectData ? (
          <ul className="output-stage-list">
            {stages.map((stage, index) => {
              const output = outputs.find((item) => item.stage === stage);
              return (
                <li key={stage} className={output ? "placed" : "pending"}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{getOutputStageLabel(stage)}</strong>
                  <em>{output ? "記録済み" : "未出力"}</em>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title="まだ出力できる制作結果がありません" body="要件入力から自動制作を実行すると、工程ボードと成果物をここで確認できます。" />
        )}
      </section>
      <section className="panel output-side-panel">
        <h3>出力の見方</h3>
        <p>左から右へ、要件整理、探索、文字組み、5案比較、背景3案、Final Candidateの順で確認します。</p>
        <ul className="review-check-list">
          <li><span className="check-dot done">✓</span>工程ごとの判断理由が残る</li>
          <li><span className="check-dot done">✓</span>Finalは背景3案を活かした3枚で確認</li>
          <li><span className="check-dot done">✓</span>必要な箇所はFigma上で編集可能</li>
        </ul>
      </section>
    </div>
  );
}

function getOutputStageLabel(stage: ProcessBoardStage): string {
  const labels: Record<ProcessBoardStage, string> = {
    project_header: "Project Header",
    ideas: "30 Ideas Explore",
    typography_drafts: "15 Typography Drafts",
    refined_svgs: "5 Refined SVGs",
    diagnosis: "Diagnosis",
    compare: "Compare Result",
    background_variations: "Background Variations",
    final_candidate: "Final Candidates",
  };
  return labels[stage];
}
