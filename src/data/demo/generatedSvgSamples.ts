import type { ContentType } from "../../schemas/content";

export type GeneratedSvgSampleMap = Record<ContentType, Record<string, string>>;

const baseAttrs = 'width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"';

export const generatedSvgSamples: GeneratedSvgSampleMap = {
  note_thumbnail: {
    note_question_01: `<svg ${baseAttrs}>
  <defs>
    <linearGradient id="note-question-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#F4F1EA"/>
      <stop offset="1" stop-color="#E0F2FE"/>
    </linearGradient>
  </defs>
  <g id="background">
    <rect width="800" height="450" fill="url(#note-question-bg)"/>
    <circle cx="660" cy="104" r="86" fill="#BAE6FD" opacity="0.65"/>
    <path d="M540 352 C602 286 682 298 752 246" fill="none" stroke="#111827" stroke-width="2" opacity="0.22"/>
    <rect x="48" y="40" width="704" height="370" rx="24" fill="#101820"/>
  </g>
  <g id="headline">
    <text x="88" y="132" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="800">
      <tspan x="88" dy="0">AI時代、</tspan>
      <tspan x="88" dy="58">デザイナーは</tspan>
      <tspan x="88" dy="58">何を持つべきか</tspan>
    </text>
    <text x="92" y="324" fill="#BAE6FD" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="600">制作から判断へ。これからの働き方を考える。</text>
  </g>
  <g id="support">
    <rect x="604" y="286" width="106" height="46" rx="23" fill="#EAB308"/>
    <text x="626" y="316" fill="#101820" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800">THINK</text>
    <text x="604" y="370" fill="#CBD5E1" font-family="Inter, Arial, sans-serif" font-size="13">note / design workflow</text>
  </g>
</svg>`,
    note_editorial_02: `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#FAFAF7"/>
    <rect x="48" y="40" width="704" height="370" rx="18" fill="#FFFFFF"/>
    <rect x="88" y="80" width="4" height="290" fill="#A7F3D0"/>
    <circle cx="643" cy="128" r="44" fill="#E5E7EB"/>
    <circle cx="678" cy="162" r="44" fill="#D1FAE5"/>
    <line x1="552" y1="336" x2="704" y2="336" stroke="#CBD5E1" stroke-width="2"/>
  </g>
  <g id="headline">
    <text x="136" y="178" fill="#1F2937" font-family="Inter, Arial, sans-serif" font-size="54" font-weight="700">
      <tspan x="136" dy="0">作る人から、</tspan>
      <tspan x="136" dy="68">判断する人へ。</tspan>
    </text>
    <text x="140" y="303" fill="#64748B" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600">AI時代のデザインワークフロー</text>
  </g>
  <g id="support">
    <text x="604" y="305" fill="#1F2937" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="700">EDITORIAL</text>
    <text x="604" y="329" fill="#64748B" font-family="Inter, Arial, sans-serif" font-size="13">thinking / workflow</text>
  </g>
</svg>`,
    note_practical_03: `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#F8FAFC"/>
    <rect x="48" y="40" width="704" height="370" rx="22" fill="#0F172A"/>
    <rect x="560" y="72" width="156" height="288" rx="18" fill="#E0F2FE"/>
    <path d="M96 356 H470" stroke="#38BDF8" stroke-width="5" stroke-linecap="round"/>
  </g>
  <g id="headline">
    <text x="92" y="138" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="52" font-weight="800">
      <tspan x="92" dy="0">AI時代の</tspan>
      <tspan x="92" dy="62">デザイン思考</tspan>
    </text>
    <text x="96" y="256" fill="#BAE6FD" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="600">これからの制作フローを整理する</text>
  </g>
  <g id="support">
    <rect x="586" y="108" width="104" height="50" rx="12" fill="#FFFFFF"/>
    <rect x="586" y="186" width="104" height="50" rx="12" fill="#FFFFFF"/>
    <rect x="586" y="264" width="104" height="50" rx="12" fill="#FFFFFF"/>
    <text x="611" y="140" fill="#0F172A" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800">01 Input</text>
    <text x="604" y="218" fill="#0F172A" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800">02 Judge</text>
    <text x="610" y="296" fill="#0F172A" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800">03 Flow</text>
  </g>
</svg>`,
    note_contrast_04: `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#111827"/>
    <path d="M0 0 H800 V450 H310 Z" fill="#F8FAFC"/>
    <rect x="48" y="40" width="704" height="370" rx="20" fill="none" stroke="#94A3B8" stroke-width="2"/>
    <rect x="586" y="92" width="94" height="94" rx="16" fill="#EF4444"/>
    <line x1="570" y1="314" x2="716" y2="314" stroke="#EF4444" stroke-width="6"/>
  </g>
  <g id="headline">
    <text x="86" y="164" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="850">
      <tspan x="86" dy="0">デザイナーの価値は</tspan>
      <tspan x="86" dy="60">どこに残るのか</tspan>
    </text>
    <text x="90" y="286" fill="#475569" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="700">AIと制作の距離感を考える</text>
  </g>
  <g id="support">
    <text x="602" y="145" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="900">ISSUE</text>
    <text x="574" y="354" fill="#F8FAFC" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700">critical design note</text>
  </g>
</svg>`,
    note_quiet_05: `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#F3F4F6"/>
    <rect x="48" y="40" width="704" height="370" rx="26" fill="#FFFFFF"/>
    <path d="M214 322 C302 230 396 230 486 322" fill="none" stroke="#14B8A6" stroke-width="3" opacity="0.5"/>
    <circle cx="294" cy="142" r="48" fill="#DDD6FE"/>
    <rect x="456" y="96" width="96" height="96" rx="24" fill="#CCFBF1"/>
  </g>
  <g id="headline">
    <text x="146" y="204" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="45" font-weight="750" text-anchor="start">
      <tspan x="146" dy="0">AIは作れる。</tspan>
      <tspan x="146" dy="58">では、人は何を選ぶ？</tspan>
    </text>
    <text x="150" y="309" fill="#64748B" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="600">デザインの本質を考えるノート</text>
  </g>
  <g id="support">
    <text x="576" y="346" fill="#8B5CF6" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="800">CHOICE / HUMAN</text>
  </g>
</svg>`,
  },
  seminar_banner: {
    seminar_problem_01: `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#EFF6FF"/>
    <rect x="48" y="40" width="704" height="370" rx="24" fill="#1E3A8A"/>
    <circle cx="640" cy="112" r="88" fill="#93C5FD" opacity="0.38"/>
    <rect x="536" y="254" width="170" height="78" rx="20" fill="#FFFFFF" opacity="0.15"/>
  </g>
  <g id="headline">
    <text x="88" y="148" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="56" font-weight="850">
      <tspan x="88" dy="0">AI活用、</tspan>
      <tspan x="88" dy="66">何から始める？</tspan>
    </text>
    <text x="92" y="272" fill="#DBEAFE" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="650">明日から使える実践ステップを60分で解説</text>
  </g>
  <g id="meta">
    <text x="92" y="88" fill="#BFDBFE" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="800">6.18 WED 14:00 / Online Seminar</text>
  </g>
  <g id="cta">
    <rect x="92" y="326" width="164" height="50" rx="25" fill="#F97316"/>
    <text x="122" y="358" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800">無料で参加する</text>
  </g>
</svg>`,
    seminar_benefit_02: `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#0F172A"/>
    <rect x="58" y="54" width="476" height="342" rx="22" fill="#FFFFFF"/>
    <rect x="560" y="54" width="182" height="342" rx="22" fill="#22C55E"/>
    <line x1="596" y1="146" x2="706" y2="146" stroke="#FFFFFF" stroke-width="2" opacity="0.55"/>
  </g>
  <g id="headline">
    <text x="94" y="154" fill="#0F172A" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="850">
      <tspan x="94" dy="0">60分でわかる</tspan>
      <tspan x="94" dy="58">AI活用の第一歩</tspan>
    </text>
    <text x="98" y="278" fill="#334155" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="650">業務改善に使える考え方と実践例を紹介</text>
  </g>
  <g id="meta">
    <text x="596" y="116" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="900">6.18</text>
    <text x="596" y="178" fill="#DCFCE7" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800">WED 14:00</text>
    <text x="596" y="214" fill="#DCFCE7" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700">Online Seminar</text>
  </g>
  <g id="cta">
    <rect x="98" y="322" width="166" height="48" rx="24" fill="#60A5FA"/>
    <text x="126" y="353" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800">今すぐ申し込む</text>
  </g>
</svg>`,
    seminar_practical_03: `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#F8FAFC"/>
    <rect x="48" y="40" width="704" height="370" rx="22" fill="#FFFFFF"/>
    <rect x="86" y="78" width="628" height="74" rx="18" fill="#0F172A"/>
    <rect x="86" y="260" width="178" height="86" rx="18" fill="#ECFEFF"/>
    <rect x="312" y="260" width="178" height="86" rx="18" fill="#FFFBEB"/>
    <rect x="536" y="260" width="178" height="86" rx="18" fill="#EFF6FF"/>
  </g>
  <g id="headline">
    <text x="112" y="126" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="850">明日から使える AI業務改善</text>
    <text x="94" y="210" fill="#0F172A" font-family="Inter, Arial, sans-serif" font-size="25" font-weight="750">現場で試せるプロンプト活用と導入ステップ</text>
  </g>
  <g id="meta">
    <text x="100" y="304" fill="#0E7490" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="850">Prompt</text>
    <text x="326" y="304" fill="#B45309" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="850">Process</text>
    <text x="562" y="304" fill="#1D4ED8" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="850">Action</text>
    <text x="96" y="382" fill="#475569" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="700">6.18 WED 14:00 / Online Seminar</text>
  </g>
  <g id="cta">
    <rect x="552" y="365" width="152" height="42" rx="21" fill="#06B6D4"/>
    <text x="584" y="392" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="800">無料で視聴する</text>
  </g>
</svg>`,
    seminar_trust_04: `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#111827"/>
    <rect x="48" y="40" width="704" height="370" rx="16" fill="#E5E7EB"/>
    <rect x="48" y="40" width="704" height="86" rx="16" fill="#1F2937"/>
    <rect x="596" y="126" width="156" height="284" fill="#111827"/>
    <line x1="96" y1="330" x2="520" y2="330" stroke="#93C5FD" stroke-width="4"/>
  </g>
  <g id="headline">
    <text x="94" y="208" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="850">
      <tspan x="94" dy="0">現場で使える</tspan>
      <tspan x="94" dy="58">AI活用セミナー</tspan>
    </text>
    <text x="98" y="302" fill="#4B5563" font-family="Inter, Arial, sans-serif" font-size="20" font-weight="650">導入前の不安を整理し、実践までつなげる</text>
  </g>
  <g id="meta">
    <text x="94" y="93" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="800">Online Seminar / 6.18 WED 14:00</text>
    <text x="628" y="184" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800">FOR BUSINESS</text>
  </g>
  <g id="cta">
    <rect x="624" y="322" width="96" height="44" rx="22" fill="#93C5FD"/>
    <text x="643" y="350" fill="#111827" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="850">詳細を見る</text>
  </g>
</svg>`,
    seminar_beginner_05: `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#FFF7ED"/>
    <rect x="52" y="44" width="696" height="362" rx="34" fill="#FFFFFF"/>
    <circle cx="640" cy="110" r="62" fill="#FDBA74" opacity="0.55"/>
    <circle cx="688" cy="160" r="40" fill="#BFDBFE" opacity="0.75"/>
    <rect x="86" y="82" width="150" height="34" rx="17" fill="#FFEDD5"/>
  </g>
  <g id="headline">
    <text x="88" y="186" fill="#7C2D12" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="850">
      <tspan x="88" dy="0">AI初心者のための</tspan>
      <tspan x="88" dy="58">実践ウェビナー</tspan>
    </text>
    <text x="92" y="296" fill="#9A3412" font-family="Inter, Arial, sans-serif" font-size="21" font-weight="650">専門知識なしで始める、はじめの一歩</text>
  </g>
  <g id="meta">
    <text x="108" y="105" fill="#9A3412" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="850">Beginner Welcome</text>
    <text x="92" y="344" fill="#64748B" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700">6.18 WED 14:00 / Online Seminar</text>
  </g>
  <g id="cta">
    <rect x="548" y="322" width="168" height="52" rx="26" fill="#2563EB"/>
    <text x="578" y="355" fill="#FFFFFF" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="850">無料で参加する</text>
  </g>
</svg>`,
  },
};

export function getGeneratedSvgSample(contentType: ContentType, directionId: string): string | undefined {
  return generatedSvgSamples[contentType][directionId];
}
