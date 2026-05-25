import { useEffect, useMemo, useState } from "react";
import { providerConfig } from "../config/providers";
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

const tabs: AppTab[] = ["Explore", "Diagnose", "Compare", "Finish"];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("Explore");
  const [latestBackgroundBrief, setLatestBackgroundBrief] = useState<BackgroundBrief | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [diagnoses, setDiagnoses] = useState<DiagnosisResult[]>([]);
  const [comparison, setComparison] = useState<ComparisonResult | undefined>();
  const [background, setBackground] = useState<BackgroundResult | undefined>();
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

  function handleRenderFullProcess() {
    if (!projectData) return;
    postToPlugin({ type: "RENDER_PROCESS_BOARD", payload: projectData });
  }

  function handleHeaderAction() {
    if (activeTab === "Explore") {
      window.dispatchEvent(new Event("START_AUTO_PRODUCTION"));
      return;
    }
    handleRenderFullProcess();
  }

  return (
    <main className="app-shell">
      <header className="plugin-header app-header">
        <div className="header-copy">
          <p className="eyebrow">AI Creative Process Board</p>
          <h1>AI Cover Studio</h1>
          <p className="header-description">
            {activeTab !== "Explore" && <span className="step-pill">{getStepLabel(activeTab)}</span>}
            {activeTab === "Explore" ? "要件入力からFinal Candidateまで、AI制作ジョブとして自動進行します。" : tabLabels[activeTab].description}
          </p>
        </div>
        <div className="header-meta">
          <CanvasBadge />
          <span className="provider-badge warning">実行モード: Demo Mode</span>
          <ProviderBadge label="provider" provider={providers.copy} />
          <button className="header-button" type="button" disabled={activeTab !== "Explore" && !projectData} onClick={handleHeaderAction}>
            {activeTab === "Explore" ? "\u81ea\u52d5\u5236\u4f5c\u3092\u958b\u59cb" : "\u4e00\u9023\u306e\u30d7\u30ed\u30bb\u30b9\u3092Figma\u306b\u51fa\u529b"}
          </button>
        </div>
      </header>

      <div className="plugin-stepper">
        <TabNav tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        <FlowStepper activeTab={activeTab} completedTabs={completedTabs} />
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
      </section>

      <ActionFooter>
        <StatusLog
          entries={[
            "\u73fe\u5728\u306e\u5de5\u7a0b\u306f\u4e0a\u90e8\u306e\u30b9\u30c6\u30c3\u30d1\u30fc\u3067\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002",
            "demo mode\u3067\u5168\u5de5\u7a0b\u3092\u78ba\u8a8d\u3067\u304d\u307e\u3059\u3002",
          ]}
        />
      </ActionFooter>
    </main>
  );
}

function getStepLabel(tab: AppTab): string {
  const labels: Record<AppTab, string> = {
    Explore: "Step 1/4",
    Diagnose: "Step 2/4",
    Compare: "Step 3/4",
    Finish: "Step 4/4",
  };
  return labels[tab];
}
