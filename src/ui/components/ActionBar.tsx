import type { ReactNode } from "react";

type ActionBarProps = {
  children: ReactNode;
};

export function ActionBar({ children }: ActionBarProps) {
  return <div className="action-bar">{children}</div>;
}
