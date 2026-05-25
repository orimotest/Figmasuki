import { AlertTriangle } from "lucide-react";

type ErrorMessageProps = {
  title: string;
  detail: string;
  action?: string;
};

export function ErrorMessage({ title, detail, action }: ErrorMessageProps) {
  return (
    <div className="message-box error-message" role="alert">
      <AlertTriangle size={16} />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
        {action && <small>{action}</small>}
      </div>
    </div>
  );
}
