type StatusLogProps = {
  entries: string[];
};

export function StatusLog({ entries }: StatusLogProps) {
  return (
    <aside className="status-log" aria-label="処理ログ">
      <strong>ログ</strong>
      {entries.map((entry, index) => (
        <span key={`${entry}-${index}`}>
          <i />
          {entry}
        </span>
      ))}
    </aside>
  );
}
