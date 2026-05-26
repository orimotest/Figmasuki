import type { ReactNode } from "react";

type ActionBarProps = {
  children: ReactNode;
  className?: string;
};

export function ActionBar({ children, className }: ActionBarProps) {
  return <div className={className ? `action-bar ${className}` : "action-bar"}>{children}</div>;
}
