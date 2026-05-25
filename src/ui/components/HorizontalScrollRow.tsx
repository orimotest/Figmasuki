import type { ReactNode } from "react";

type HorizontalScrollRowProps = {
  children: ReactNode;
  className?: string;
};

export function HorizontalScrollRow({ children, className = "" }: HorizontalScrollRowProps) {
  return <div className={`horizontal-scroll-row nice-scrollbar scroll-fade-bottom ${className}`}>{children}</div>;
}
