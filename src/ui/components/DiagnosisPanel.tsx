import type { DiagnosisResult, RuleCheckResult } from "../../schemas/diagnosis";
import { EmptyState } from "./EmptyState";

type DiagnosisPanelProps = {
  result?: DiagnosisResult;
};

export function DiagnosisPanel({ result }: DiagnosisPanelProps) {
  if (!result) {
    return <EmptyState title="診断結果はまだありません" body="Figma上で診断したいフレームを1つ選択してください。" />;
  }

  return (
    <div className="diagnosis-panel">
      <section className="diagnosis-section">
        <h3>診断概要</h3>
        <p>{result.summary}</p>
      </section>

      <section className="diagnosis-section">
        <h3>最初に伝わること</h3>
        <p>{result.firstImpression}</p>
        {result.needVisualReview && <span className="validation-badge invalid">目視確認推奨</span>}
      </section>

      <DiagnosisList title="強い点" items={result.strengths} tone="positive" />
      <DiagnosisList title="気になる点" items={result.concerns} tone="warning" />

      <section className="diagnosis-section">
        <h3>最初に直すなら</h3>
        {result.fixPriority.length === 0 ? (
          <p className="muted">急いで直すべき構造上の問題は大きくありません。</p>
        ) : (
          <div className="priority-list">
            {result.fixPriority.map((item) => (
              <article className="priority-item" key={`${item.target}-${item.issue}`}>
                <span className={`priority-pill ${item.priority}`}>{priorityLabel(item.priority)}</span>
                <strong>{item.target}</strong>
                <p>{item.issue}</p>
                <p className="muted">{item.suggestion}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="diagnosis-section">
        <h3>この指摘から作れる派生案</h3>
        <div className="rewrite-list">
          {result.rewriteInstructions.map((item) => (
            <article className="rewrite-chip" key={`${item.label}-${item.targetWorkflow}`}>
              <strong>{item.label}</strong>
              <span>{item.targetWorkflow}</span>
              <p>{item.instruction}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="diagnosis-section">
        <h3>構造チェック</h3>
        <ul className="check-list">
          {result.ruleCheck.checks.map((check) => (
            <RuleCheckRow key={check.id} check={check} />
          ))}
        </ul>
      </section>
    </div>
  );
}

function DiagnosisList({ title, items, tone }: { title: string; items: string[]; tone: "positive" | "warning" }) {
  return (
    <section className="diagnosis-section">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <p className="muted">項目はありません。</p>
      ) : (
        <ul className={`text-list ${tone}`}>
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RuleCheckRow({ check }: { check: RuleCheckResult }) {
  return (
    <li>
      <span className={`status-dot ${check.status}`} />
      <span>
        <strong>{check.label}</strong>
        <small>{check.message}</small>
      </span>
    </li>
  );
}

function priorityLabel(priority: "high" | "medium" | "low"): string {
  if (priority === "high") return "優先";
  if (priority === "medium") return "次に";
  return "余裕があれば";
}
