import type { ReactNode } from "react";

type ScrollableSectionProps = {
  children: ReactNode;
  className?: string;
};

export function ScrollableSection({ children, className = "" }: ScrollableSectionProps) {
  return <div className={`card-scroll-area nice-scrollbar scroll-fade-bottom ${className}`}>{children}</div>;
}
