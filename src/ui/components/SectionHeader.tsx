import type { ReactNode } from "react";

type SectionHeaderProps = {
  title: string;
  description?: string;
  aside?: ReactNode;
};

export function SectionHeader({ title, description, aside }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {aside && <div className="section-header-aside">{aside}</div>}
    </div>
  );
}
