import type { Direction } from "../../schemas/direction";
import type { ExploreInput } from "../../schemas/input";

export const noteThumbnailInputDemo: ExploreInput = {
  contentType: "note_thumbnail",
  inputMode: "brief_text",
  briefText: "AI時代にデザイナーが持つべき思考と、これからの制作フローについての記事サムネイル",
  targetAudience: "個人クリエイター、デザイナー、編集者",
  tone: "editorial",
};

export const noteThumbnailDirectionsDemo: Direction[] = [
  createNoteDirection({
    id: "note_question_01",
    title: "問いかけ型",
    summary: "読者の不安や問いを前面に出し、考えたくなる入口を作る。",
    intent: "AI時代に自分の役割を考えたい読者へ、静かな問いとして届ける。",
    layoutType: "big_type_question",
    main: "AI時代、\nデザイナーは\n何を持つべきか",
    sub: "制作から判断へ。これからの働き方を考える",
    palette: ["#101820", "#F4F1EA", "#7DD3FC", "#EAB308"],
    risk: "問いが強いため、記事内容が実用寄りの場合は少し抽象的に見える可能性があります。",
  }),
  createNoteDirection({
    id: "note_editorial_02",
    title: "余白・編集感型",
    summary: "読み物としての落ち着きと、保存したくなる品のよさを優先する。",
    intent: "noteらしい余韻を作り、広告ではなくエッセイとして読ませる。",
    layoutType: "editorial_whitespace",
    main: "作る人から、\n判断する人へ。",
    sub: "AI時代のデザインワークフロー",
    palette: ["#FAFAF7", "#1F2937", "#A7F3D0", "#CBD5E1"],
    risk: "余白が広いため、一覧画面では控えめに見える可能性があります。",
  }),
  createNoteDirection({
    id: "note_practical_03",
    title: "実用ノウハウ型",
    summary: "保存したくなる実用記事として、要点が整理されている印象を作る。",
    intent: "これからの制作フローを知りたい読者へ、具体的な学びがありそうに見せる。",
    layoutType: "practical_index",
    main: "AI時代の\nデザイン思考",
    sub: "これからの制作フローを整理する",
    palette: ["#F8FAFC", "#0F172A", "#38BDF8", "#22C55E"],
    risk: "実用感が強くなり、思考系の記事らしい余韻は弱まります。",
  }),
  createNoteDirection({
    id: "note_contrast_04",
    title: "問題提起型",
    summary: "AIによる制作の変化を、少し鋭い主張として見せる。",
    intent: "危機感ではなく論点を提示し、議論したくなる入口にする。",
    layoutType: "statement_contrast",
    main: "デザイナーの価値は\nどこに残るのか",
    sub: "AIと制作の距離感を考える",
    palette: ["#111827", "#F8FAFC", "#EF4444", "#94A3B8"],
    risk: "やや硬く見えるため、穏やかなブランドには強すぎる可能性があります。",
  }),
  createNoteDirection({
    id: "note_quiet_05",
    title: "静かな主張型",
    summary: "生成そのものより、人間の選択や判断に焦点を当てる。",
    intent: "AIが作る時代でも、人が選ぶ価値を静かに伝える。",
    layoutType: "quiet_statement",
    main: "AIは作れる。\nでは、人は何を選ぶ？",
    sub: "デザインの本質を考えるノート",
    palette: ["#F3F4F6", "#111827", "#8B5CF6", "#14B8A6"],
    risk: "抽象度が高いため、具体的なノウハウ記事では内容が伝わりにくい場合があります。",
  }),
];

function createNoteDirection(input: {
  id: string;
  title: string;
  summary: string;
  intent: string;
  layoutType: string;
  main: string;
  sub: string;
  palette: string[];
  risk: string;
}): Direction {
  return {
    id: input.id,
    contentType: "note_thumbnail",
    title: input.title,
    name: input.title,
    summary: input.summary,
    intent: input.intent,
    layoutType: input.layoutType,
    tone: ["editorial", "calm", "thoughtful"],
    copy: {
      main: input.main,
      sub: input.sub,
      headline: input.main,
      subheadline: input.sub,
    },
    layoutBrief: {
      id: `layout_${input.id}`,
      contentType: "note_thumbnail",
      title: input.title,
      description: "大きな見出しと余白で、記事の主題が一目で残る構成にする。",
      composition: "主見出しを大きく置き、補助コピーと小さな装飾で読み物感を作る。",
      hierarchy: ["メインコピー", "サブコピー", "小さなテーマラベル"],
      constraints: ["広告感を出しすぎない", "文字を安全領域に収める"],
    },
    styleBrief: {
      mood: "静か、知的、読み物らしい",
      palette: input.palette,
      typography: "可読性の高いサンセリフを大きく使う",
      visualMotifs: ["抽象線", "紙面感", "小さなラベル"],
    },
    rationale: input.summary,
    riskNote: input.risk,
    tags: ["note", input.layoutType],
  };
}
