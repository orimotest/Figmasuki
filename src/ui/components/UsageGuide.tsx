type UsageGuideProps = {
  title?: string;
  steps?: string[];
  note?: string;
};

const defaultSteps = [
  "要件を入力する、またはサンプルから開始する",
  "自動制作を開始する",
  "30案探索、15案ドラフト、5案SVGを順番に確認する",
  "比較結果と背景3案をFigma上で確認する",
  "Final Candidateを編集・調整する",
];

export function UsageGuide({ title = "制作フロー", steps = defaultSteps, note }: UsageGuideProps) {
  return (
    <section className="usage-guide">
      <div>
        <strong>{title}</strong>
        {note && <p>{note}</p>}
      </div>
      <ol>
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
