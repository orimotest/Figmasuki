import type { Direction } from "../../schemas/direction";
import type { ExploreInput } from "../../schemas/input";

export const seminarBannerInputDemo: ExploreInput = {
  contentType: "seminar_banner",
  inputMode: "brief_text",
  briefText:
    "オンラインセミナー集客用のバナー。対象はAI活用に関心はあるが、何から試すべきか迷っている事業部門の担当者。60分で基本の考え方と明日使える実践例を持ち帰れることを伝えたい。",
  targetAudience: "AI活用を検討する事業部門の担当者",
  tone: "trustworthy-practical-friendly",
};

export const seminarBannerDirectionsDemo: Direction[] = [
  createSeminarDirection({
    id: "seminar_problem_01",
    title: "課題共感型",
    summary: "AI活用に不安がある人へ、自分ごととして感じてもらう。",
    intent: "導入前の迷いを入口にし、最初の一歩が小さく見えるようにする。",
    layoutType: "problem_to_cta",
    main: "AI活用、\n何から始める？",
    sub: "明日試せる実践ステップを60分で整理",
    cta: "無料で参加する",
    palette: ["#EFF6FF", "#1E3A8A", "#F97316", "#FFFFFF"],
    risk: "一般論に見えないよう、背景と補助コピーで実務感を足したい。",
    bestFor: "初心者向けの導入セミナー",
  }),
  createSeminarDirection({
    id: "seminar_benefit_02",
    title: "参加メリット型",
    summary: "参加することで得られる内容を明確に見せる。",
    intent: "参加することで得られる内容を明確に見せる。",
    layoutType: "benefit_first",
    main: "60分でわかる\nAI活用の第一歩",
    sub: "現場で試せる考え方と実践例を紹介",
    cta: "今すぐ申し込む",
    palette: ["#F7FAFF", "#0F235C", "#2563EB", "#16A34A"],
    risk: "申し込み訴求が強く、初回接点では広告感が出やすい。",
    bestFor: "申込を意識した告知バナー",
  }),
  createSeminarDirection({
    id: "seminar_practical_03",
    title: "実務ノウハウ型",
    summary: "具体的な実務メリットを前面に出す。",
    intent: "現場で試せるプロンプト活用と導入ステップを見せる。",
    layoutType: "practical_blocks",
    main: "明日から使える\nAI業務改善",
    sub: "小さく試せるプロンプト活用と導入ステップ",
    cta: "無料で視聴する",
    palette: ["#0F235C", "#123C7C", "#67E8F9", "#16A34A"],
    risk: "情報量が増えすぎると読みづらくなる。",
    bestFor: "実務者向けセミナー",
  }),
  createSeminarDirection({
    id: "seminar_trust_04",
    title: "信頼感型",
    summary: "BtoB向けに落ち着いた信頼感を出す。",
    intent: "担当者が社内共有しやすい、堅実な情報設計にする。",
    layoutType: "trust_editorial",
    main: "現場で使える\nAI活用セミナー",
    sub: "導入前の不安を整理し、実践までつなげる",
    cta: "詳細を見る",
    palette: ["#111827", "#E5E7EB", "#93C5FD", "#FFFFFF"],
    risk: "安心感はある一方で、印象が少し弱くなる可能性がある。",
    bestFor: "企業向け・管理職向け告知",
  }),
  createSeminarDirection({
    id: "seminar_beginner_05",
    title: "初心者歓迎型",
    summary: "初心者でも参加しやすい安心感を出す。",
    intent: "専門用語を抑え、初めて参加する人が置いていかれない印象を作る。",
    layoutType: "beginner_friendly",
    main: "AI初心者のための\n実践ウェビナー",
    sub: "専門知識なしではじめる、最初の一歩",
    cta: "無料で参加する",
    palette: ["#FFF7ED", "#7C2D12", "#FDBA74", "#2563EB"],
    risk: "やさしすぎて差別化が弱くなる可能性がある。",
    bestFor: "未経験者・初学者向け",
  }),
];

function createSeminarDirection(input: {
  id: string;
  title: string;
  summary: string;
  intent: string;
  layoutType: string;
  main: string;
  sub: string;
  cta: string;
  palette: string[];
  risk: string;
  bestFor: string;
}): Direction {
  return {
    id: input.id,
    contentType: "seminar_banner",
    title: input.title,
    name: input.title,
    summary: input.summary,
    intent: input.intent,
    layoutType: input.layoutType,
    tone: ["clear", "trustworthy", "friendly"],
    copy: {
      main: input.main,
      sub: input.sub,
      cta: input.cta,
      headline: input.main,
      subheadline: input.sub,
      body: "6.18 WED 14:00 / Online Seminar",
      notes: [`向いている用途: ${input.bestFor}`],
    },
    layoutBrief: {
      id: `layout_${input.id}`,
      contentType: "seminar_banner",
      title: input.title,
      description: "メインコピー、サブコピー、日時、CTAの順で読みやすく整理する。",
      composition: getComposition(input.layoutType),
      hierarchy: ["メインコピー", "サブコピー", "日時", "CTA"],
      constraints: ["800x450の安全領域に主要文字を収める", "CTAと日時を見失わせない", "背景は文字領域を邪魔しない"],
    },
    styleBrief: {
      mood: getMood(input.layoutType),
      palette: input.palette,
      typography: "視認性の高いサンセリフ。主見出しを太く、補助情報は控えめにする。",
      visualMotifs: ["ソフトなテック系グラデーション", "情報カード", "控えめな幾何学パターン"],
    },
    rationale: input.summary,
    riskNote: input.risk,
    tags: ["seminar", input.layoutType, input.bestFor],
  };
}

function getComposition(layoutType: string): string {
  const map: Record<string, string> = {
    problem_to_cta: "左側に問いかけ型の大見出し、下部にCTA、右側に余白と軽い装飾を置く。",
    benefit_first: "白い情報面にメインコピーを大きく置き、右側の情報カードで得られる内容を補足する。",
    practical_blocks: "中央に実務メリットを大きく置き、下部に3つの学習ポイントを並べる。",
    trust_editorial: "落ち着いた余白とヘッダー帯で、企業向けに共有しやすい堅実さを出す。",
    beginner_friendly: "丸みのあるカードと明るい色で、初心者が入りやすい柔らかさを作る。",
  };
  return map[layoutType] ?? "メインコピーを中心に、CTAと日時を安全領域内へ整理する。";
}

function getMood(layoutType: string): string {
  const map: Record<string, string> = {
    problem_to_cta: "親しみやすいブルー、やさしい問いかけ、低めの心理的ハードル",
    benefit_first: "明快、申し込みやすい、ビジネス向けのコントラスト",
    practical_blocks: "実務的、整理されている、学べる内容が見える",
    trust_editorial: "落ち着き、信頼感、BtoBらしい堅実さ",
    beginner_friendly: "やさしい、安心感、初めてでも参加しやすい",
  };
  return map[layoutType] ?? "信頼感と親しみやすさを両立する。";
}
