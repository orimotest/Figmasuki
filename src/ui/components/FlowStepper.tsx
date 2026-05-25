import { Check } from "lucide-react";
import type { AppTab } from "./TabNav";
import { tabLabels } from "../labels";

export type FlowStepState = "current" | "completed" | "pending";

type FlowStepperProps = {
  activeTab: AppTab;
  completedTabs?: AppTab[];
};

const orderedTabs: AppTab[] = ["Explore", "Diagnose", "Compare", "Finish"];

export function FlowStepper({ activeTab, completedTabs = [] }: FlowStepperProps) {
  return (
    <ol className="flow-stepper" aria-label="制作フロー">
      {orderedTabs.map((tab, index) => {
        const state: FlowStepState = tab === activeTab ? "current" : completedTabs.includes(tab) ? "completed" : "pending";
        return (
          <li key={tab} className={`flow-step ${state}`}>
            <span className="flow-step-index">{state === "completed" ? <Check size={12} /> : index + 1}</span>
            <span className="flow-step-text">
              <strong>{tabLabels[tab].label}</strong>
              <small>{tabLabels[tab].shortDescription}</small>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
