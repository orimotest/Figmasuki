type EmptyStateProps = {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, body, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
      {actionLabel && onAction && (
        <button className="secondary-button compact" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}
