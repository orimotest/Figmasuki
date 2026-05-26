import { useEffect, useMemo, useState } from "react";
import { providerConfig } from "../config/providers";
import { getRuntimeExecutionModeLabel, RUNTIME_API_SETTINGS_CHANGED_EVENT } from "../config/runtimeApiSettings";
import type { BackgroundBrief, BackgroundResult } from "../schemas/background";
import type { ComparisonResult } from "../schemas/comparison";
import type { DiagnosisResult } from "../schemas/diagnosis";
import type { ProjectData } from "../schemas/project";
import type { ProviderConfig } from "../schemas/provider";
import { postToPlugin } from "../plugin/figma/messageBridge";
import { ActionFooter } from "./components/ActionFooter";
import { CanvasBadge } from "./components/CanvasBadge";
import { FlowStepper } from "./components/FlowStepper";
import { ProviderBadge } from "./components/ProviderBadge";
import { StatusLog } from "./components/StatusLog";
import { TabNav, type AppTab } from "./components/TabNav";
import { tabLabels } from "./labels";
import { CompareScreen } from "./screens/CompareScreen";
import { DiagnoseScreen } from "./screens/DiagnoseScreen";
import { ExploreScreen } from "./screens/ExploreScreen";
import { FinishScreen } from "./screens/FinishScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

const tabs: AppTab[] = ["Explore", "Diagnose", "Compare", "Finish", "Settings"];
const productionTabs: AppTab[] = ["Explore", "Diagnose", "Compare", "Finish"];

const uiSizePresets = {
  S: { width: 760, height: 640 },
  M: { width: 860, height: 680 },
  L: { width: 1040, height: 760 },
} as const;

type UiSizePreset = keyof typeof uiSizePresets;

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("Explore");
  const [uiSize, setUiSize] = useState<UiSizePreset>("S");
  const [latestBackgroundBrief, setLatestBackgroundBrief] = useState<BackgroundBrief | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | undefined>();
  const [background, setBackground] = useState<BackgroundResult | undefined>();
  const [executionMode, setExecutionMode] = useState<"Live" | "Demo">(() => getRuntimeExecutionModeLabel());
  const providers: ProviderConfig = providerConfig;

  const completedTabs = useMemo<AppTab[]>(() => {
    const completed: AppTab[] = [];
    if (projectData?.svgCandidates.length || activeTab !== "Explore") completed.push("Explore");
    if (diagnoses.length || projectData?.diagnosisResults.length || activeTab === "Compare" || activeTab === "Finish") completed.push("Diagnose");
    if (comparison || projectData?.comparisonResult || activeTab === "Finish") completed.push("Compare");
    if (background || projectData?.backgroundResult) completed.push("Finish");
    return completed;
  }, [activeTab, projectData, diagnoses.length, comparison, background]);

  useEffect(() => {
    const handleTabChange = (event: Event) => {
      const tab = (event as CustomEvent<AppTab>).detail;
      if (tabs.includes(tab)) setActiveTab(tab);
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

  function handleRenderFullProcess() {
    if (!projectData) return;
    postToPlugin({ type: "RENDER_PROCESS_BOARD", payload: projectData });
  }

  function handleHeaderAction() {
    if (activeTab === "Explore") {
      window.dispatchEvent(new Event("START_AUTO_PRODUCTION"));
      return;
    }
    if (activeTab === "Settings") {
      window.dispatchEvent(new Event("SAVE_API_SETTINGS_FROM_HEADER"));
      return;
    }
    handleRenderFullProcess();
  }

  function handleResizeUi(size: UiSizePreset) {
    setUiSize(size);
    postToPlugin({ type: "RESIZE_UI", payload: uiSizePresets[size] });
  }

  return (
    <main className="app-shell">
      <header className="plugin-header app-header">
        <div className="header-copy">
          <p className="eyebrow">AI Creative Process Board</p>
          <h1>AI Cover Studio</h1>
          <p className="header-description">
            {activeTab !== "Explore" && productionTabs.includes(activeTab) && <span className="step-pill">{getStepLabel(activeTab)}</span>}
            {tabLabels[activeTab].description}
          </p>
        </div>
        <div className="header-meta">
          <CanvasBadge />
          <span className={executionMode === "Live" ? "provider-badge success" : "provider-badge warning"}>実行モード: {executionMode}</span>
          <ProviderBadge label="provider" provider={providers.copy} />
          <div className="ui-size-control" aria-label="UI size">
            {(["S", "M", "L"] as UiSizePreset[]).map((size) => (
              <button key={size} className={uiSize === size ? "active" : ""} type="button" onClick={() => handleResizeUi(size)}>
                {size}
              </button>
            ))}
          </div>
          <button className="header-button" type="button" disabled={activeTab !== "Explore" && activeTab !== "Settings" && !projectData} onClick={handleHeaderAction}>
            {activeTab === "Explore" ? "自動制作を開始" : activeTab === "Settings" ? "設定を保存" : "一連のプロセスをFigmaに出力"}
          </button>
        </div>
      </header>

      <div className="plugin-stepper">
        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab !== "Settings" && <FlowStepper activeTab={activeTab} completedTabs={completedTabs} />}
      </div>

      <section className="plugin-scroll-area nice-scrollbar scroll-fade-bottom screen-area">
        {activeTab === "Explore" && (
          <ExploreScreen
            providers={providers}
            projectData={projectData}
            onProjectData={(project) => {
              setProjectData(project);
              if (!project) {
                setDiagnoses([]);
                setComparison(undefined);
                setBackground(undefined);
                setLatestBackgroundBrief(null);
              }
            }}
          />
        )}
        {activeTab === "Diagnose" && (
          <DiagnoseScreen
            providers={providers}
            projectData={projectData}
            onProjectData={setProjectData}
            onDiagnosis={(result) => setDiagnoses((items) => [...items, result])}
          />
        )}
        {activeTab === "Compare" && (
          <CompareScreen
            providers={providers}
            projectData={projectData}
            onProjectData={setProjectData}
            onComparison={setComparison}
            onSendToFinish={(brief) => {
              setLatestBackgroundBrief(brief);
              setActiveTab("Finish");
            }}
          />
        )}
        {activeTab === "Finish" && (
          <FinishScreen
            providers={providers}
            backgroundBrief={latestBackgroundBrief}
            comparisonResult={comparison}
            projectData={projectData}
            onProjectData={setProjectData}
            onBackground={setBackground}
          />
        )}
        {activeTab === "Settings" && <SettingsScreen />}
      </section>

      <ActionFooter>
        <StatusLog
          entries={[
            "現在の工程は上部のステッパーで確認できます。",
            "API設定を保存するとLive Modeで実行できます。未設定の場合はDemo Modeで進行します。",
          ]}
        />
      </ActionFooter>
    </main>
  );
}

function getStepLabel(tab: AppTab): string {
  const labels: Partial<Record<AppTab, string>> = {
    Explore: "Step 1/4",
    Diagnose: "Step 2/4",
    Compare: "Step 3/4",
    Finish: "Step 4/4",
  };
  return labels[tab] ?? "";
}
