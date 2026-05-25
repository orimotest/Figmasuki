import type { ReactNode } from "react";

type ActionFooterProps = {
  children: ReactNode;
};

export function ActionFooter({ children }: ActionFooterProps) {
  return <footer className="plugin-action-footer">{children}</footer>;
}
