import type { Direction } from "../../schemas/direction";
import type { ExploreInput } from "../../schemas/input";

export const seminarBannerInputDemo: ExploreInput = {
  contentType: "seminar_banner",
  inputMode: "brief_text",
  briefText:
    "オンラインセミナー集客用のバナー。時間のないビジネスパーソンに向けて、短時間で学べる価値を伝えたい。信頼感と親しみやすさを両立したい。",
  targetAudience: "忙しいビジネスパーソン",
  tone: "trustworthy-friendly",
};

export const seminarBannerDirectionsDemo: Direction[] = [
  createSeminarDirection({
    id: "seminar_problem_01",
    title: "課題共感型",
    summary: "AI活用に不安がある人へ、自分ごととして感じてもらう。",
    intent: "AI活用に不安がある人へ、最初の一歩をやさしく提示する。",
    layoutType: "problem_to_cta",
    main: "AI活用、\n何から始める？",
    sub: "明日から使える実践ステップを60分で解説",
    cta: "無料で参加する",
    palette: ["#EFF6FF", "#1E3A8A", "#F97316", "#FFFFFF"],
    risk: "やや一般的に見える可能性がある。",
    bestFor: "初心者向けの導入セミナー",
  }),
  createSeminarDirection({
    id: "seminar_benefit_02",
    title: "参加メリット型",
    summary: "参加することで得られる内容を明確に見せる。",
    intent: "参加することで得られる内容を明確に見せる。",
    layoutType: "benefit_first",
    main: "60分でわかる\nAI活用の第一歩",
    sub: "業務改善に使える考え方と実践例を紹介",
    cta: "今すぐ申し込む",
    palette: ["#0F172A", "#FFFFFF", "#22C55E", "#60A5FA"],
    risk: "少し広告感が強くなる可能性がある。",
    bestFor: "申込を意識した告知バナー",
  }),
  createSeminarDirection({
    id: "seminar_practical_03",
    title: "実務ノウハウ型",
    summary: "具体的な実務メリットを前面に出す。",
    intent: "具体的な実務メリットを前面に出す。",
    layoutType: "practical_blocks",
    main: "明日から使える\nAI業務改善",
    sub: "現場で試せるプロンプト活用と導入ステップ",
    cta: "無料で視聴する",
    palette: ["#F8FAFC", "#0F172A", "#06B6D4", "#F59E0B"],
    risk: "情報量が増えすぎると読みづらくなる。",
    bestFor: "実務者向けセミナー",
  }),
  createSeminarDirection({
    id: "seminar_trust_04",
    title: "信頼感型",
    summary: "BtoB向けに落ち着いた信頼感を出す。",
    intent: "BtoB向けに落ち着いた信頼感を出す。",
    layoutType: "trust_editorial",
    main: "現場で使える\nAI活用セミナー",
    sub: "導入前の不安を整理し、実践までつなげる",
    cta: "詳細を見る",
    palette: ["#111827", "#E5E7EB", "#93C5FD", "#FFFFFF"],
    risk: "印象が少し弱くなる可能性がある。",
    bestFor: "企業向け・管理職向け告知",
  }),
  createSeminarDirection({
    id: "seminar_beginner_05",
    title: "初心者歓迎型",
    summary: "初心者でも参加しやすい安心感を出す。",
    intent: "初心者でも参加しやすい安心感を出す。",
    layoutType: "beginner_friendly",
    main: "AI初心者のための\n実践ウェビナー",
    sub: "専門知識なしで始める、はじめの一歩",
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
    problem_to_cta: "左側に問いかけ型の大見出し、下部にCTA、右側に余白と装飾を置く。",
    benefit_first: "白い情報面にメインコピーを大きく置き、右側の縦帯で日時を強調する。",
    practical_blocks: "上部に講座名、中央に実務メリット、下部に3つの学習ポイントを並べる。",
    trust_editorial: "ヘッダー帯と落ち着いた本文エリアで、企業向けの信頼感を出す。",
    beginner_friendly: "角丸の白い面と暖色アクセントで、初心者が入りやすい柔らかさを作る。",
  };
  return map[layoutType] ?? "メインコピーを中心に、CTAと日時を安全領域内へ整理する。";
}

function getMood(layoutType: string): string {
  const map: Record<string, string> = {
    problem_to_cta: "親しみやすいブルー、やさしい問いかけ、低めの心理的ハードル",
    benefit_first: "明快、申込しやすい、ビジネス向けのコントラスト",
    practical_blocks: "実務的、整理されている、学べる内容が見える",
    trust_editorial: "落ち着き、信頼感、BtoBらしい堅実さ",
    beginner_friendly: "やさしい、安心感、初めてでも参加しやすい",
  };
  return map[layoutType] ?? "信頼感と親しみやすさを両立する。";
}
