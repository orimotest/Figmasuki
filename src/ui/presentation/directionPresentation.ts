import type { Direction } from "../../schemas/direction";
import type { SvgCandidate } from "../../schemas/svg";

export function getDirectionBestFor(direction: Direction): string {
  const explicit = direction.copy.notes?.find((note) => note.startsWith("向いている用途:"));
  if (explicit) return explicit.replace("向いている用途:", "").trim();

  const map: Record<string, string> = {
    problem_to_cta: "初心者向けの導入セミナー",
    benefit_first: "申込を意識した告知バナー",
    practical_blocks: "実務者向けセミナー",
    trust_editorial: "企業向け・管理職向け告知",
    beginner_friendly: "未経験者・初学者向け",
    big_type_question: "問いを前面に出すnote記事",
    editorial_whitespace: "読み物感を重視したnote記事",
    practical_index: "保存されやすい実用記事",
    statement_contrast: "論点を強く見せたい記事",
    quiet_statement: "静かな主張を残したい記事",
  };
  return map[direction.layoutType] ?? "方向性の比較・検討";
}

export function getSvgCandidateDescription(candidate: SvgCandidate, direction?: Direction): string {
  if (direction) {
    return `${direction.title}の意図を、${direction.layoutType} の構図で800x450に整理したSVG候補です。`;
  }
  return `${candidate.name} のSVG候補です。`;
}
