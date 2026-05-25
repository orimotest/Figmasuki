import type { Direction } from "../../schemas/direction";
import type { ExploreInput } from "../../schemas/input";

export const seminarBannerInputDemo: ExploreInput = {
  contentType: "seminar_banner",
  inputMode: "brief_text",
  briefText: "はじめてのAI活用セミナー。明日から使える業務改善の考え方と実践ステップを紹介するウェビナーバナー",
  targetAudience: "AI活用を始めたいマーケティング担当者",
  tone: "beginner-friendly",
};

export const seminarBannerDirectionsDemo: Direction[] = [
  createSeminarDirection({
    id: "seminar_problem_01",
    title: "課題共感型",
    summary: "AI活用に不安がある人へ、自分ごととして感じてもらう。",
    intent: "初心者のつまずきに寄り添い、参加の心理的ハードルを下げる。",
    layoutType: "problem_to_cta",
    main: "AI活用、\n何から始める？",
    sub: "明日から使える実践ステップを60分で解説",
    cta: "無料で参加する",
    palette: ["#EFF6FF", "#1E3A8A", "#F97316", "#FFFFFF"],
    risk: "親しみやすい一方で、専門性は控えめに見える可能性があります。",
  }),
  createSeminarDirection({
    id: "seminar_benefit_02",
    title: "参加メリット型",
    summary: "参加することで得られる内容を明確に見せる。",
    intent: "時間対効果を先に伝え、申し込み判断をしやすくする。",
    layoutType: "benefit_first",
    main: "60分でわかる\nAI活用の第一歩",
    sub: "業務改善に使える考え方と実践例を紹介",
    cta: "今すぐ申し込む",
    palette: ["#0F172A", "#FFFFFF", "#22C55E", "#60A5FA"],
    risk: "やや広告感が強くなる可能性があります。",
  }),
  createSeminarDirection({
    id: "seminar_practical_03",
    title: "実践ノウハウ型",
    summary: "現場で試せる具体性を前面に出す。",
    intent: "参加後に何を持ち帰れるかを、ブロック構成で整理する。",
    layoutType: "practical_blocks",
    main: "明日から使える\nAI業務改善",
    sub: "プロンプト活用と導入ステップを実例で紹介",
    cta: "無料で視聴する",
    palette: ["#F8FAFC", "#0F172A", "#06B6D4", "#F59E0B"],
    risk: "実務感が強く、感情的な期待感は控えめです。",
  }),
  createSeminarDirection({
    id: "seminar_trust_04",
    title: "信頼感型",
    summary: "BtoB向けに落ち着いた信頼感を優先する。",
    intent: "担当者が社内共有しやすい、堅実な情報設計にする。",
    layoutType: "trust_editorial",
    main: "現場で使える\nAI活用セミナー",
    sub: "導入前の不安を整理し、実践までつなげる",
    cta: "詳細を見る",
    palette: ["#111827", "#E5E7EB", "#93C5FD", "#FFFFFF"],
    risk: "安心感はある一方で、初心者向けの軽さは少し弱くなります。",
  }),
  createSeminarDirection({
    id: "seminar_beginner_05",
    title: "初心者歓迎型",
    summary: "専門知識がなくても参加できる安心感を出す。",
    intent: "初めてAI活用を学ぶ人に、やさしい入口を作る。",
    layoutType: "beginner_friendly",
    main: "AI初心者のための\n実践ウェビナー",
    sub: "専門知識なしではじめる、最初の一歩",
    cta: "無料で参加する",
    palette: ["#FFF7ED", "#7C2D12", "#FDBA74", "#2563EB"],
    risk: "やさしい印象が強く、上級者向けには物足りなく見える可能性があります。",
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
}): Direction {
  return {
    id: input.id,
    contentType: "seminar_banner",
    title: input.title,
    name: input.title,
    summary: input.summary,
    intent: input.intent,
    layoutType: input.layoutType,
    tone: ["clear", "trustworthy", "beginner-friendly"],
    copy: {
      main: input.main,
      sub: input.sub,
      cta: input.cta,
      headline: input.main,
      subheadline: input.sub,
      body: "6.18 WED 14:00 / Online Seminar",
    },
    layoutBrief: {
      id: `layout_${input.id}`,
      contentType: "seminar_banner",
      title: input.title,
      description: "メインコピー、日時、参加メリット、CTAの順で読みやすく整理する。",
      composition: "左に大見出し、右または下部に日時とCTAをまとめる。",
      hierarchy: ["メインコピー", "サブコピー", "日時", "CTA"],
      constraints: ["CTAを安全領域に収める", "日付と参加メリットを見失わせない"],
    },
    styleBrief: {
      mood: "信頼感、わかりやすさ、実践感",
      palette: input.palette,
      typography: "視認性の高いサンセリフ",
      visualMotifs: ["ソフトなテック系グラデーション", "情報カード", "幾何学パターン"],
    },
    rationale: input.summary,
    riskNote: input.risk,
    tags: ["seminar", input.layoutType],
  };
}
