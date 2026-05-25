import type { ContentType } from "../../schemas/content";

type DemoDataButtonProps = {
  type: ContentType;
  onClick: (type: ContentType) => void;
};

export function DemoDataButton({ type, onClick }: DemoDataButtonProps) {
  const label = type === "note_thumbnail" ? "noteサンプルを読み込む" : "セミナーサンプルを読み込む";
  return (
    <button className="secondary-button compact" type="button" onClick={() => onClick(type)}>
      {label}
    </button>
  );
}
