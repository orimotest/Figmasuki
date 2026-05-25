import type { ContentType } from "../../schemas/content";

export type GeneratedSvgSampleMap = Record<ContentType, Record<string, string>>;

const baseAttrs = 'width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"';

export const generatedSvgSamples: GeneratedSvgSampleMap = {
  note_thumbnail: {
    note_question_01: noteSvg("#101820", "#F4F1EA", "AI時代、", "デザイナーは何を持つべきか", "制作から判断へ。これからの働き方を考える"),
    note_editorial_02: noteSvg("#FFFFFF", "#FAFAF7", "作る人から、", "判断する人へ。", "AI時代のデザインワークフロー"),
    note_practical_03: noteSvg("#0F172A", "#F8FAFC", "AI時代の", "デザイン思考", "これからの制作フローを整理する"),
    note_contrast_04: noteSvg("#111827", "#F8FAFC", "デザイナーの価値は", "どこに残るのか", "AIと制作の距離感を考える"),
    note_quiet_05: noteSvg("#FFFFFF", "#F3F4F6", "AIは作れる。", "では、人は何を選ぶ？", "デザインの本質を考えるノート"),
  },
  seminar_banner: {
    seminar_problem_01: seminarProblemSvg(),
    seminar_benefit_02: seminarBenefitSvg(),
    seminar_practical_03: seminarPracticalSvg(),
    seminar_trust_04: seminarTrustSvg(),
    seminar_beginner_05: seminarBeginnerSvg(),
  },
};

export function getGeneratedSvgSample(contentType: ContentType, directionId: string): string | undefined {
  return generatedSvgSamples[contentType][directionId];
}

function noteSvg(panel: string, bg: string, line1: string, line2: string, sub: string): string {
  return `<svg ${baseAttrs}>
  <rect width="800" height="450" fill="${bg}"/>
  <rect x="48" y="40" width="704" height="370" rx="26" fill="${panel}"/>
  <circle cx="650" cy="130" r="70" fill="#7DD3FC" opacity="0.35"/>
  <path d="M520 340 C600 280 675 300 740 240" fill="none" stroke="#14B8A6" stroke-width="3" opacity="0.45"/>
  <g id="headline">
    <text x="92" y="172" fill="${panel === "#FFFFFF" ? "#111827" : "#FFFFFF"}" font-family="Inter, Arial, sans-serif" font-size="52" font-weight="850">
      <tspan x="92" dy="0">${line1}</tspan>
      <tspan x="92" dy="64">${line2}</tspan>
    </text>
    <text x="96" y="308" fill="${panel === "#FFFFFF" ? "#64748B" : "#BAE6FD"}" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="650">${sub}</text>
  </g>
  <text x="600" y="366" fill="${panel === "#FFFFFF" ? "#8B5CF6" : "#CBD5E1"}" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="800">NOTE / DESIGN</text>
</svg>`;
}

function seminarProblemSvg(): string {
  return `<svg ${baseAttrs}>
  <defs>
    <linearGradient id="problem-bg-grad" x1="0" y1="0" x2="800" y2="450" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F7FAFF"/>
      <stop offset="1" stop-color="#EEF4FF"/>
    </linearGradient>
    <linearGradient id="problem-title-grad" x1="56" y1="120" x2="258" y2="120" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#3B82F6"/>
      <stop offset="1" stop-color="#155EEF"/>
    </linearGradient>
  </defs>
  <g id="background">
    <rect width="800" height="450" rx="24" fill="url(#problem-bg-grad)"/>
    <rect x="24" y="24" width="752" height="402" rx="20" fill="#FFFFFF" stroke="#D8E4F5"/>
    <rect x="24" y="24" width="752" height="10" rx="5" fill="#E9F1FF"/>
  </g>
  <g id="top-badge">
    <rect x="56" y="46" width="228" height="40" rx="20" fill="#1D63FF"/>
    <text x="170" y="66" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="16" font-weight="700" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">初心者向け｜導入セミナー</text>
  </g>
  <g id="headline">
    <text x="56" y="150" fill="url(#problem-title-grad)" font-size="72" font-weight="800" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">AI</text>
    <text x="176" y="150" fill="#163B7A" font-size="72" font-weight="800" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">活用、</text>
    <text x="56" y="228" fill="#1D63FF" font-size="64" font-weight="800" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">何から</text>
    <text x="238" y="228" fill="#163B7A" font-size="64" font-weight="800" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">始める？</text>
    <line x1="60" y1="242" x2="220" y2="242" stroke="#FFC83D" stroke-width="8" stroke-linecap="round"/>
  </g>
  <g id="subcopy">
    <text x="56" y="282" fill="#334155" font-size="24" font-weight="600" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">明日から使える実践ステップを</text>
    <text x="420" y="282" fill="#1D63FF" font-size="26" font-weight="800" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">60分</text>
    <text x="500" y="282" fill="#334155" font-size="24" font-weight="600" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">で解説</text>
  </g>
  <g id="divider">
    <line x1="56" y1="302" x2="744" y2="302" stroke="#E5EDF8"/>
  </g>
  <g id="meta-row">
    <g transform="translate(56 322)">
      <rect width="150" height="44" rx="14" fill="#F8FBFF" stroke="#D8E4F5"/>
      <rect x="14" y="11" width="20" height="20" rx="4" stroke="#1D63FF" stroke-width="2"/>
      <line x1="14" y1="18" x2="34" y2="18" stroke="#1D63FF" stroke-width="2"/>
      <line x1="20" y1="9" x2="20" y2="14" stroke="#1D63FF" stroke-width="2" stroke-linecap="round"/>
      <line x1="28" y1="9" x2="28" y2="14" stroke="#1D63FF" stroke-width="2" stroke-linecap="round"/>
      <text x="48" y="27" fill="#163B7A" font-size="15" font-weight="700" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">6.18 WED</text>
    </g>
    <g transform="translate(220 322)">
      <rect width="170" height="44" rx="14" fill="#F8FBFF" stroke="#D8E4F5"/>
      <circle cx="24" cy="22" r="10" stroke="#1D63FF" stroke-width="2"/>
      <path d="M24 16V22H29" stroke="#1D63FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="48" y="27" fill="#163B7A" font-size="15" font-weight="700" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">14:00〜15:00</text>
    </g>
    <g transform="translate(404 322)">
      <rect width="138" height="44" rx="14" fill="#F8FBFF" stroke="#D8E4F5"/>
      <rect x="14" y="12" width="20" height="14" rx="2" stroke="#1D63FF" stroke-width="2"/>
      <line x1="20" y1="30" x2="28" y2="30" stroke="#1D63FF" stroke-width="2" stroke-linecap="round"/>
      <line x1="24" y1="26" x2="24" y2="30" stroke="#1D63FF" stroke-width="2" stroke-linecap="round"/>
      <text x="48" y="27" fill="#163B7A" font-size="15" font-weight="700" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">Online</text>
    </g>
  </g>
  <g id="support-note">
    <text x="56" y="396" fill="#64748B" font-size="14" font-weight="500" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">専門知識なしでも参加しやすい、やさしい導入セミナーです</text>
  </g>
  <g id="cta">
    <rect x="544" y="356" width="200" height="52" rx="26" fill="#16A34A"/>
    <text x="632" y="382" text-anchor="middle" dominant-baseline="middle" fill="#FFFFFF" font-size="18" font-weight="800" font-family="Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif">無料で参加する</text>
    <circle cx="714" cy="382" r="12" fill="#FFFFFF" opacity="0.18"/>
    <path d="M710 378L716 382L710 386" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

function seminarBenefitSvg(): string {
  return `<svg ${baseAttrs}>
  <rect width="800" height="450" fill="#0F172A"/>
  <rect x="58" y="54" width="476" height="342" rx="22" fill="#FFFFFF"/>
  <rect x="560" y="54" width="182" height="342" rx="22" fill="#22C55E"/>
  <line x1="596" y1="146" x2="706" y2="146" stroke="#FFFFFF" stroke-width="2" opacity="0.55"/>
  <g id="headline">
    <text x="94" y="154" fill="#0F172A" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="850">
      <tspan x="94" dy="0">60分でわかる</tspan>
      <tspan x="94" dy="58">AI活用の第一歩</tspan>
    </text>
    <text x="98" y="278" fill="#334155" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="650">業務改善に使える考え方と実践例を紹介</text>
  </g>
  <text x="596" y="116" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900">6.18</text>
  <text x="596" y="178" fill="#DCFCE7" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800">WED 14:00</text>
  <text x="596" y="214" fill="#DCFCE7" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700">Online Seminar</text>
  <g id="cta">
    <rect x="98" y="322" width="170" height="48" rx="24" fill="#60A5FA"/>
    <text x="124" y="353" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800">今すぐ申し込む</text>
  </g>
</svg>`;
}

function seminarPracticalSvg(): string {
  return `<svg ${baseAttrs}>
  <rect width="800" height="450" fill="#F8FAFC"/>
  <rect x="48" y="40" width="704" height="370" rx="22" fill="#FFFFFF"/>
  <rect x="86" y="78" width="628" height="74" rx="18" fill="#0F172A"/>
  <rect x="86" y="260" width="178" height="86" rx="18" fill="#ECFEFF"/>
  <rect x="312" y="260" width="178" height="86" rx="18" fill="#FFFBEB"/>
  <rect x="536" y="260" width="178" height="86" rx="18" fill="#EFF6FF"/>
  <g id="headline">
    <text x="112" y="126" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="850">明日から使える AI業務改善</text>
    <text x="94" y="210" fill="#0F172A" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="750">現場で試せるプロンプト活用と導入ステップ</text>
  </g>
  <text x="100" y="304" fill="#0E7490" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="850">Prompt</text>
  <text x="326" y="304" fill="#B45309" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="850">Process</text>
  <text x="562" y="304" fill="#1D4ED8" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="850">Action</text>
  <text x="96" y="382" fill="#475569" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700">6.18 WED 14:00 / Online Seminar</text>
  <g id="cta">
    <rect x="552" y="365" width="156" height="42" rx="21" fill="#06B6D4"/>
    <text x="580" y="392" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="800">無料で視聴する</text>
  </g>
</svg>`;
}

function seminarTrustSvg(): string {
  return `<svg ${baseAttrs}>
  <rect width="800" height="450" fill="#111827"/>
  <rect x="48" y="40" width="704" height="370" rx="16" fill="#E5E7EB"/>
  <rect x="48" y="40" width="704" height="86" rx="16" fill="#1F2937"/>
  <rect x="596" y="126" width="156" height="284" fill="#111827"/>
  <line x1="96" y1="330" x2="520" y2="330" stroke="#93C5FD" stroke-width="4"/>
  <g id="headline">
    <text x="94" y="208" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="850">
      <tspan x="94" dy="0">現場で使える</tspan>
      <tspan x="94" dy="58">AI活用セミナー</tspan>
    </text>
    <text x="98" y="302" fill="#4B5563" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="650">導入前の不安を整理し、実践までつなげる</text>
  </g>
  <text x="94" y="93" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800">Online Seminar / 6.18 WED 14:00</text>
  <text x="628" y="184" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800">FOR BUSINESS</text>
  <g id="cta">
    <rect x="624" y="322" width="96" height="44" rx="22" fill="#93C5FD"/>
    <text x="643" y="350" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="850">詳細を見る</text>
  </g>
</svg>`;
}

function seminarBeginnerSvg(): string {
  return `<svg ${baseAttrs}>
  <rect width="800" height="450" fill="#FFF7ED"/>
  <rect x="52" y="44" width="696" height="362" rx="34" fill="#FFFFFF"/>
  <circle cx="640" cy="110" r="62" fill="#FDBA74" opacity="0.55"/>
  <circle cx="688" cy="160" r="40" fill="#BFDBFE" opacity="0.75"/>
  <rect x="86" y="82" width="150" height="34" rx="17" fill="#FFEDD5"/>
  <g id="headline">
    <text x="88" y="186" fill="#7C2D12" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="850">
      <tspan x="88" dy="0">AI初心者のための</tspan>
      <tspan x="88" dy="58">実践ウェビナー</tspan>
    </text>
    <text x="92" y="296" fill="#9A3412" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="650">専門知識なしで始める、はじめの一歩</text>
  </g>
  <text x="108" y="105" fill="#9A3412" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="850">Beginner Welcome</text>
  <text x="92" y="344" fill="#64748B" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700">6.18 WED 14:00 / Online Seminar</text>
  <g id="cta">
    <rect x="548" y="322" width="168" height="52" rx="26" fill="#2563EB"/>
    <text x="578" y="355" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="850">無料で参加する</text>
  </g>
</svg>`;
}
