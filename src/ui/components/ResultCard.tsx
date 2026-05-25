import type { ReactNode } from "react";

type ResultCardProps = {
  title: string;
  body?: string;
  children?: ReactNode;
};

export function ResultCard({ title, body, children }: ResultCardProps) {
  return (
    <article className="result-card">
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {children}
    </article>
  );
}
