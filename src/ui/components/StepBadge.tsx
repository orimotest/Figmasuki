import type { ReactNode } from "react";

type StepBadgeProps = {
  children: ReactNode;
};

export function StepBadge({ children }: StepBadgeProps) {
  return <span className="step-badge">{children}</span>;
}
