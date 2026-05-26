import { GitCompareArrows, ImagePlus, ScanSearch, Settings, Sparkles } from "lucide-react";
import { tabLabels } from "../labels";

export type AppTab = "Explore" | "Diagnose" | "Compare" | "Finish" | "Settings";

type TabNavProps = {
  tabs: AppTab[];
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

const tabIcons = {
  Explore: Sparkles,
  Diagnose: ScanSearch,
  Compare: GitCompareArrows,
  Finish: ImagePlus,
  Settings,
} satisfies Record<AppTab, typeof Sparkles>;

export function TabNav({ tabs, activeTab, onChange }: TabNavProps) {
  return (
    <nav className="tab-nav" aria-label="Workflow phases">
      {tabs.map((tab) => {
        const Icon = tabIcons[tab];
        return (
          <button
            key={tab}
            className={tab === activeTab ? "tab-button active" : "tab-button"}
            type="button"
            onClick={() => onChange(tab)}
            aria-pressed={tab === activeTab}
            title={tabLabels[tab].label}
          >
            <Icon size={16} aria-hidden="true" />
            <span>{tabLabels[tab].label}</span>
          </button>
        );
      })}
    </nav>
  );
}
