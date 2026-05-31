import type { ContentType } from "../../schemas/content";

export type GeneratedSvgSampleMap = Record<ContentType, Record<string, string>>;

const baseAttrs = 'width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg"';
const font = "Inter, 'Noto Sans JP', 'Hiragino Sans', sans-serif";

export const generatedSvgSamples: GeneratedSvgSampleMap = {
  note_thumbnail: {
    note_question_01: noteSvg("#101820", "#F4F1EA", "AI時代、", "デザイナーは何を見る？", "制作から判断へ。これからの考え方を整理する"),
    note_editorial_02: noteSvg("#FFFFFF", "#FAFAF7", "作る人から、", "判断する人へ。", "AI時代のデザインワークフロー"),
    note_practical_03: noteSvg("#0F172A", "#F8FAFC", "AI時代の", "デザイン思考", "これからの制作フローを整理する"),
    note_contrast_04: noteSvg("#111827", "#F8FAFC", "デザインの価値は", "どこに残るのか", "AIと制作の距離感を考える"),
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
  const isLight = panel === "#FFFFFF";
  return `<svg ${baseAttrs}>
  <rect width="800" height="450" fill="${bg}"/>
  <rect x="48" y="40" width="704" height="370" rx="26" fill="${panel}" stroke="${isLight ? "#E5E7EB" : panel}"/>
  <circle cx="650" cy="130" r="70" fill="#7DD3FC" opacity="0.32"/>
  <path d="M520 340 C600 280 675 300 740 240" fill="none" stroke="#14B8A6" stroke-width="3" opacity="0.42"/>
  <g id="headline">
    <text x="92" y="172" fill="${isLight ? "#111827" : "#FFFFFF"}" font-family="${font}" font-size="52" font-weight="850">
      <tspan x="92" dy="0">${escapeXml(line1)}</tspan>
      <tspan x="92" dy="64">${escapeXml(line2)}</tspan>
    </text>
    <text x="96" y="308" fill="${isLight ? "#64748B" : "#BAE6FD"}" font-family="${font}" font-size="22" font-weight="650">${escapeXml(sub)}</text>
  </g>
  <text x="600" y="366" fill="${isLight ? "#8B5CF6" : "#CBD5E1"}" font-family="${font}" font-size="14" font-weight="800">NOTE / DESIGN</text>
</svg>`;
}

function seminarProblemSvg(): string {
  return `<svg ${baseAttrs}>
  <defs>
    <linearGradient id="problem-bg" x1="0" y1="0" x2="800" y2="450" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F7FAFF"/>
      <stop offset="1" stop-color="#EAF2FF"/>
    </linearGradient>
  </defs>
  <g id="background">
    <rect width="800" height="450" rx="24" fill="url(#problem-bg)"/>
    <rect x="28" y="28" width="744" height="394" rx="22" fill="#FFFFFF" stroke="#D8E4F5"/>
    <circle cx="676" cy="108" r="72" fill="#DBEAFE" opacity="0.7"/>
    <circle cx="722" cy="328" r="84" fill="#EFF6FF"/>
  </g>
  <g id="headline">
    <text x="64" y="128" fill="#0F235C" font-size="56" font-weight="850" font-family="${font}">AI活用、</text>
    <text x="64" y="194" fill="#0F235C" font-size="56" font-weight="850" font-family="${font}">何から始める？</text>
    <line x1="66" y1="214" x2="248" y2="214" stroke="#FACC15" stroke-width="8" stroke-linecap="round"/>
  </g>
  <g id="subcopy">
    <text x="66" y="268" fill="#334155" font-size="23" font-weight="700" font-family="${font}">明日から使える実践ステップを60分で整理</text>
  </g>
  ${benefitMiniCards(66, 304)}
  ${metaLine(66, 386)}
  ${ctaGroup(544, 336, "無料で参加する", "#16A34A", 190)}
</svg>`;
}

function seminarBenefitSvg(): string {
  return `<svg ${baseAttrs}>
  <defs>
    <linearGradient id="benefit-bg" x1="0" y1="0" x2="800" y2="450" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#F7FAFF"/>
      <stop offset="1" stop-color="#EEF5FF"/>
    </linearGradient>
    <linearGradient id="benefit-title" x1="64" y1="0" x2="520" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#1E3A8A"/>
      <stop offset="1" stop-color="#2563EB"/>
    </linearGradient>
  </defs>
  <g id="background">
    <rect width="800" height="450" rx="24" fill="url(#benefit-bg)"/>
    <rect x="28" y="28" width="744" height="394" rx="22" fill="#FFFFFF" stroke="#D8E4F5"/>
    <circle cx="690" cy="94" r="72" fill="#EAF3FF"/>
    <circle cx="732" cy="384" r="90" fill="#F0F7FF"/>
  </g>
  <g id="headline">
    <text x="64" y="120" fill="#0F235C" font-size="56" font-weight="850" font-family="${font}">60分でわかる</text>
    <text x="64" y="188" fill="url(#benefit-title)" font-size="62" font-weight="850" font-family="${font}">AI活用の第一歩</text>
    <line x1="66" y1="208" x2="342" y2="208" stroke="#FACC15" stroke-width="8" stroke-linecap="round"/>
  </g>
  <g id="subcopy">
    <text x="66" y="260" fill="#334155" font-size="23" font-weight="700" font-family="${font}">業務改善に使える考え方と実践例を紹介</text>
  </g>
  <g id="support-panel">
    <rect x="580" y="92" width="154" height="170" rx="24" fill="#F8FBFF" stroke="#D8E4F5"/>
    <text x="606" y="134" fill="#1E3A8A" font-size="15" font-weight="850" font-family="${font}">このセミナーで</text>
    <text x="606" y="158" fill="#1E3A8A" font-size="15" font-weight="850" font-family="${font}">わかること</text>
    ${checkText(606, 196, "全体像")}
    ${checkText(606, 224, "始め方")}
    ${checkText(606, 252, "実践例")}
  </g>
  ${benefitMiniCards(66, 298)}
  ${metaLine(66, 386)}
  ${ctaGroup(548, 326, "今すぐ申し込む", "#16A34A", 186)}
</svg>`;
}

function seminarPracticalSvg(): string {
  return `<svg ${baseAttrs}>
  <defs>
    <linearGradient id="practical-bg" x1="0" y1="0" x2="800" y2="450" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0F235C"/>
      <stop offset="1" stop-color="#123C7C"/>
    </linearGradient>
  </defs>
  <g id="background">
    <rect width="800" height="450" rx="24" fill="url(#practical-bg)"/>
    <rect x="28" y="28" width="744" height="394" rx="22" fill="#FFFFFF" fill-opacity="0.05" stroke="#FFFFFF" stroke-opacity="0.16"/>
    <circle cx="138" cy="98" r="72" fill="#38BDF8" fill-opacity="0.12"/>
    <circle cx="686" cy="344" r="96" fill="#67E8F9" fill-opacity="0.10"/>
  </g>
  <g id="headline">
    <text x="400" y="140" text-anchor="middle" fill="#FFFFFF" font-size="54" font-weight="850" font-family="${font}">明日から使える</text>
    <text x="400" y="214" text-anchor="middle" fill="#67E8F9" font-size="72" font-weight="850" font-family="${font}">AI業務改善</text>
    <line x1="300" y1="234" x2="500" y2="234" stroke="#FACC15" stroke-width="8" stroke-linecap="round"/>
  </g>
  <g id="subcopy">
    <text x="400" y="286" text-anchor="middle" fill="#DCEBFF" font-size="23" font-weight="700" font-family="${font}">現場で試せるプロンプト活用と導入ステップ</text>
  </g>
  <g id="learning-points">
    ${darkPoint(106, 322, "基本を整理", "まず何を知るべきか")}
    ${darkPoint(314, 322, "実例で理解", "業務での使い方を見る")}
    ${darkPoint(522, 322, "小さく実践", "明日から試せる")}
  </g>
  <g id="meta">
    <rect x="68" y="392" width="328" height="36" rx="14" fill="#FFFFFF"/>
    <text x="94" y="416" fill="#163B7A" font-size="13" font-weight="850" font-family="${font}">6.18 WED</text>
    <text x="204" y="416" fill="#163B7A" font-size="13" font-weight="850" font-family="${font}">14:00-15:00</text>
    <text x="322" y="416" fill="#163B7A" font-size="13" font-weight="850" font-family="${font}">Online</text>
  </g>
  ${ctaGroup(548, 384, "無料で視聴する", "#16A34A", 186, 42)}
</svg>`;
}

function seminarTrustSvg(): string {
  return `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#111827"/>
    <rect x="48" y="40" width="704" height="370" rx="16" fill="#E5E7EB"/>
    <rect x="48" y="40" width="704" height="86" rx="16" fill="#1F2937"/>
    <rect x="596" y="126" width="156" height="284" fill="#111827"/>
  </g>
  <g id="headline">
    <text x="94" y="208" fill="#111827" font-family="${font}" font-size="46" font-weight="850">
      <tspan x="94" dy="0">現場で使える</tspan>
      <tspan x="94" dy="58">AI活用セミナー</tspan>
    </text>
    <text x="98" y="302" fill="#4B5563" font-family="${font}" font-size="20" font-weight="650">導入前の不安を整理し、実践までつなげる</text>
  </g>
  <g id="meta">
    <text x="94" y="93" fill="#FFFFFF" font-family="${font}" font-size="17" font-weight="800">6.18 WED 14:00 / Online</text>
    <text x="628" y="184" fill="#FFFFFF" font-family="${font}" font-size="18" font-weight="800">FOR BUSINESS</text>
  </g>
  ${ctaGroup(600, 320, "詳細を見る", "#93C5FD", 132, 48, "#111827")}
</svg>`;
}

function seminarBeginnerSvg(): string {
  return `<svg ${baseAttrs}>
  <g id="background">
    <rect width="800" height="450" fill="#FFF7ED"/>
    <rect x="52" y="44" width="696" height="362" rx="34" fill="#FFFFFF" stroke="#FED7AA"/>
    <circle cx="640" cy="110" r="62" fill="#FDBA74" opacity="0.42"/>
    <circle cx="688" cy="160" r="40" fill="#BFDBFE" opacity="0.70"/>
  </g>
  <g id="headline">
    <text x="88" y="176" fill="#7C2D12" font-family="${font}" font-size="46" font-weight="850">
      <tspan x="88" dy="0">AI初心者のための</tspan>
      <tspan x="88" dy="58">実践ウェビナー</tspan>
    </text>
    <text x="92" y="292" fill="#9A3412" font-family="${font}" font-size="21" font-weight="650">専門知識なしで始める、はじめの一歩</text>
  </g>
  <g id="meta">
    <text x="92" y="344" fill="#64748B" font-family="${font}" font-size="16" font-weight="700">6.18 WED 14:00 / Online</text>
  </g>
  ${ctaGroup(520, 320, "無料で参加する", "#2563EB", 196, 54)}
</svg>`;
}

function benefitMiniCards(x: number, y: number): string {
  return `<g id="benefit-cards">
    ${miniCard(x, y, "要点を整理", "迷わず始める")}
    ${miniCard(x + 166, y, "実例で理解", "使い方が見える")}
    ${miniCard(x + 332, y, "明日から実践", "小さく試せる")}
  </g>`;
}

function miniCard(x: number, y: number, title: string, sub: string): string {
  return `<g transform="translate(${x} ${y})">
    <rect width="150" height="58" rx="16" fill="#F8FBFF" stroke="#D8E4F5"/>
    <circle cx="26" cy="29" r="13" fill="#EFF6FF"/>
    <path d="M20 29L25 34L34 23" stroke="#2563EB" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="48" y="25" fill="#1E3A8A" font-size="13" font-weight="850" font-family="${font}">${escapeXml(title)}</text>
    <text x="48" y="43" fill="#64748B" font-size="11" font-weight="650" font-family="${font}">${escapeXml(sub)}</text>
  </g>`;
}

function checkText(x: number, y: number, value: string): string {
  return `<g transform="translate(${x} ${y})">
    <circle cx="8" cy="8" r="8" fill="#DBEAFE"/>
    <path d="M5 8L8 11L12 5" stroke="#2563EB" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="24" y="12" fill="#334155" font-size="12" font-weight="700" font-family="${font}">${escapeXml(value)}</text>
  </g>`;
}

function darkPoint(x: number, y: number, title: string, sub: string): string {
  return `<g transform="translate(${x} ${y})">
    <rect width="172" height="54" rx="16" fill="#FFFFFF" fill-opacity="0.08" stroke="#FFFFFF" stroke-opacity="0.18"/>
    <text x="22" y="24" fill="#FFFFFF" font-size="14" font-weight="850" font-family="${font}">${escapeXml(title)}</text>
    <text x="22" y="42" fill="#BAE6FD" font-size="11" font-weight="650" font-family="${font}">${escapeXml(sub)}</text>
  </g>`;
}

function metaLine(x: number, y: number): string {
  return `<g id="meta">
    <rect x="${x}" y="${y}" width="392" height="36" rx="14" fill="#FFFFFF" stroke="#D8E4F5"/>
    <text x="${x + 26}" y="${y + 24}" fill="#163B7A" font-size="13" font-weight="850" font-family="${font}">6.18 WED</text>
    <line x1="${x + 126}" y1="${y + 9}" x2="${x + 126}" y2="${y + 27}" stroke="#D8E4F5"/>
    <text x="${x + 148}" y="${y + 24}" fill="#163B7A" font-size="13" font-weight="850" font-family="${font}">14:00-15:00</text>
    <line x1="${x + 270}" y1="${y + 9}" x2="${x + 270}" y2="${y + 27}" stroke="#D8E4F5"/>
    <text x="${x + 292}" y="${y + 24}" fill="#163B7A" font-size="13" font-weight="850" font-family="${font}">Online</text>
  </g>`;
}

function ctaGroup(x: number, y: number, value: string, color: string, width: number, height = 50, textFill = "#FFFFFF"): string {
  const fontSize = value.length > 8 ? 15 : 17;
  return `<g id="cta">
    <rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${height / 2}" fill="${color}"/>
    <text x="${x + width / 2}" y="${y + height / 2 + Math.round(fontSize * 0.36)}" text-anchor="middle" fill="${textFill}" font-size="${fontSize}" font-weight="850" letter-spacing="0" font-family="${font}">${escapeXml(value)}</text>
  </g>`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
