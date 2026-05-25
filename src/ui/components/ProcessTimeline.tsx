import { Check, Circle, LoaderCircle, X } from "lucide-react";

export type ProcessStepStatus = "pending" | "running" | "completed" | "error";

export type ProcessTimelineStep = {
  label: string;
  description?: string;
  status: ProcessStepStatus;
};

type ProcessTimelineProps = {
  title?: string;
  steps: ProcessTimelineStep[];
};

const icons = {
  pending: Circle,
  running: LoaderCircle,
  completed: Check,
  error: X,
} satisfies Record<ProcessStepStatus, typeof Circle>;

export function ProcessTimeline({ title = "処理の流れ", steps }: ProcessTimelineProps) {
  return (
    <section className="process-timeline" aria-label={title}>
      <h3>{title}</h3>
      <ol>
        {steps.map((step) => {
          const Icon = icons[step.status];
          return (
            <li key={step.label} className={`timeline-step ${step.status}`}>
              <span className="timeline-icon">
                <Icon size={13} />
              </span>
              <span className="timeline-copy">
                <strong>{step.label}</strong>
                {step.description && <small>{step.description}</small>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
