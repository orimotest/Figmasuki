import type { BackgroundBrief, BackgroundResult } from "../../schemas/background";
import { EmptyState } from "./EmptyState";

type FinishPanelProps = {
  brief?: BackgroundBrief | null;
  result?: BackgroundResult;
};

export function FinishPanel({ brief, result }: FinishPanelProps) {
  if (!brief) {
    return <EmptyState title="背景生成briefがありません" body="まず比較画面で、背景を仕上げるベース案を選んでください。" />;
  }

  return (
    <div className="finish-panel-content">
      <section className="diagnosis-section">
        <h3>対象案</h3>
        <p>{brief.targetFrameName}</p>
      </section>
      <section className="diagnosis-section">
        <h3>background brief</h3>
        <dl className="detail-list">
          <div>
            <dt>背景の方向性</dt>
            <dd>{brief.promptText}</dd>
          </div>
          <div>
            <dt>雰囲気</dt>
            <dd>{brief.mood}</dd>
          </div>
          <div>
            <dt>背景スタイル</dt>
            <dd>{brief.style}</dd>
          </div>
          <div>
            <dt>避けること</dt>
            <dd>{brief.avoid.join(", ")}</dd>
          </div>
          <div>
            <dt>文字領域への配慮</dt>
            <dd>{brief.safeAreaHint}</dd>
          </div>
          <div>
            <dt>suggested style keywords</dt>
            <dd>{brief.suggestedStyleKeywords.join(", ")}</dd>
          </div>
        </dl>
      </section>
      {result && (
        <section className="diagnosis-section">
          <h3>生成された背景</h3>
          <div className="mini-meta">
            <span>{result.type}</span>
            <span>{result.styleName}</span>
            <span>{result.status}</span>
          </div>
          <div className="color-strip">
            {result.colors.map((color) => (
              <span key={color} style={{ background: color }} title={color} />
            ))}
          </div>
          <p className="muted">{result.message ?? "文字とCTAを編集可能なまま残す背景レイヤーです。"}</p>
        </section>
      )}
    </div>
  );
}
