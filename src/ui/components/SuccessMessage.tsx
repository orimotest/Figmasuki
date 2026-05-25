import { CheckCircle2 } from "lucide-react";

type SuccessMessageProps = {
  title: string;
  detail?: string;
};

export function SuccessMessage({ title, detail }: SuccessMessageProps) {
  return (
    <div className="message-box success-message" role="status">
      <CheckCircle2 size={16} />
      <div>
        <strong>{title}</strong>
        {detail && <p>{detail}</p>}
      </div>
    </div>
  );
}
