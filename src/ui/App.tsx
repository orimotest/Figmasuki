import { useEffect, useMemo, useState } from "react";
import { providerConfig } from "../config/providers";
import { getRuntimeExecutionModeLabel, RUNTIME_API_SETTINGS_CHANGED_EVENT } from "../config/runtimeApiSettings";
import type { BackgroundResult } from "../schemas/background";
import type { ComparisonResult } from "../schemas/comparison";
import type { ProjectData } from "../schemas/project";
import type { ProviderConfig } from "../schemas/provider";
import { postToPlugin } from "../plugin/figma/messageBridge";
import { ActionFooter } from "./components/ActionFooter";
import { CanvasBadge } from "./components/CanvasBadge";
import { FlowStepper } from "./components/FlowStepper";
import { StatusLog } from "./components/StatusLog";
import { TabNav, type AppTab } from "./components/TabNav";
import { tabLabels } from "./labels";
import { CompareScreen } from "./screens/CompareScreen";
import { ExploreScreen } from "./screens/ExploreScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

const tabs: AppTab[] = ["Brief", "Explore", "Compare", "Settings"];
const productionTabs: AppTab[] = ["Brief", "Explore", "Compare"];

const uiSizePresets = {
  S: { width: 800, height: 450 },
  M: { width: 900, height: 560 },
  L: { width: 1040, height: 720 },
} as const;

type UiSizePreset = keyof typeof uiSizePresets;

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("Brief");
  const [uiSize, setUiSize] = useState<UiSizePreset>("S");
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | undefined>();
  const [background, setBackground] = useState<BackgroundResult | undefined>();
  const [executionMode, setExecutionMode] = useState<"Live" | "Demo">(() => getRuntimeExecutionModeLabel());
  const providers: ProviderConfig = providerConfig;

  const completedTabs = useMemo<AppTab[]>(() => {
    const completed: AppTab[] = [];
    if (activeTab !== "Brief") completed.push("Brief");
    if (projectData?.svgCandidates.length || activeTab === "Compare") completed.push("Explore");
    if (comparison || projectData?.comparisonResult || background || projectData?.backgroundResult) completed.push("Compare");
    return completed;
  }, [activeTab, projectData, comparison, background]);

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
          <p className="eyebrow">Figma Production Plugin</p>
          <h1>Figma Cover Studio</h1>
          <p className="header-description">
            {productionTabs.includes(activeTab) && <span className="step-pill">{getStepLabel(activeTab)}</span>}
            {tabLabels[activeTab].description}
          </p>
        </div>
        <div className="header-meta">
          <CanvasBadge />
          <span className={executionMode === "Live" ? "provider-badge success" : "provider-badge warning"}>
            {executionMode === "Live" ? "Live Mode" : "Demo Mode"}
          </span>
          <div className="ui-size-control" aria-label="UI size">
            {(["S", "M", "L"] as UiSizePreset[]).map((size) => (
              <button key={size} className={uiSize === size ? "active" : ""} type="button" onClick={() => handleResizeUi(size)}>
                {size}
              </button>
            ))}
          </div>
          {activeTab !== "Brief" && activeTab !== "Explore" && (
            <button className="header-button" type="button" disabled={activeTab !== "Settings" && !projectData} onClick={handleHeaderAction}>
              {activeTab === "Settings" ? "設定を保存" : "一連のプロセスをFigmaに出力"}
            </button>
          )}
        </div>
      </header>

      <div className="plugin-stepper">
        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab !== "Settings" && <FlowStepper activeTab={activeTab} completedTabs={completedTabs} />}
      </div>

      <section className="plugin-scroll-area nice-scrollbar scroll-fade-bottom screen-area">
        {(activeTab === "Brief" || activeTab === "Explore") && (
          <ExploreScreen
            phase={activeTab === "Brief" ? "brief" : "production"}
            providers={providers}
            projectData={projectData}
            onProceedToProduction={() => setActiveTab("Explore")}
            onProjectData={(project) => {
              setProjectData(project);
              if (!project) {
                setComparison(undefined);
                setBackground(undefined);
              }
            }}
          />
        )}
        {activeTab === "Compare" && (
          <CompareScreen
            providers={providers}
            projectData={projectData}
            onProjectData={setProjectData}
            onComparison={setComparison}
            onBackground={setBackground}
          />
        )}
        {activeTab === "Settings" && <SettingsScreen />}
      </section>

      <ActionFooter>
        <StatusLog
          entries={[
            activeTab === "Brief"
              ? "要件を整理すると、制作タブで一括生成に進めます。"
              : activeTab === "Settings"
                ? "APIキーは保存時にFigma clientStorageへ送ります。Gitには書き込みません。"
                : "工程ごとの判断材料とFigma記録状況を確認できます。",
            executionMode === "Live" ? "Live Modeで外部APIに接続しています。" : "Demo Modeでは実案件風の代替データで制作フローを確認できます。",
          ]}
        />
      </ActionFooter>
    </main>
  );
}

function getStepLabel(tab: AppTab): string {
  const labels: Partial<Record<AppTab, string>> = {
    Brief: "Step 1/2",
    Explore: "Step 2/2",
    Compare: "Sub Tool",
  };
  return labels[tab] ?? "";
}
