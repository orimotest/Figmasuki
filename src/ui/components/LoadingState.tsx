import { LoaderCircle } from "lucide-react";

type LoadingStateProps = {
  title: string;
  description: string;
};

export function LoadingState({ title, description }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <LoaderCircle className="loading-spinner" size={18} />
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </div>
  );
}
