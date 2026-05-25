type UsageGuideProps = {
  title?: string;
  steps?: string[];
  note?: string;
};

const defaultSteps = [
  "探索でDemoフローを開始",
  "5案をFigmaに配置",
  "1案を選択して診断",
  "2〜5案を選択して比較",
  "比較で選ばれた案に背景を適用",
];

export function UsageGuide({ title = "APIなしで試す場合", steps = defaultSteps, note }: UsageGuideProps) {
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
