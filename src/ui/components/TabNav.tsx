import { ClipboardList, GitCompareArrows, Layers, SlidersHorizontal } from "lucide-react";
import { tabLabels } from "../labels";

export type AppTab = "Brief" | "Explore" | "Compare" | "Settings";

type TabNavProps = {
  tabs: AppTab[];
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
};

const tabIcons = {
  Brief: ClipboardList,
  Explore: Layers,
  Compare: GitCompareArrows,
  Settings: SlidersHorizontal,
} satisfies Record<AppTab, typeof Layers>;

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
