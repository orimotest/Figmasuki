import type { BackgroundResult } from "../../schemas/background";
import type { ComparisonResult } from "../../schemas/comparison";
import type { Direction } from "../../schemas/direction";
import type { LayoutDraftInput, TypographyDraftLayoutType } from "../../schemas/layoutDraft";
import type { SvgCandidate } from "../../schemas/svg";
import type { BackgroundVariation, DemoComparison, FinalCandidate, IdeaDirection, RefinedSvgCandidate, StageWorkflowData, TypographyDraft } from "../../schemas/workflow";
import { createTypographyDraftSvg } from "../../utils/typographyDraftSvg";
import { editorialPaperBackgroundDataUrl, softGradientBackgroundDataUrl, subtleGeometryBackgroundDataUrl } from "./backgroundImageData";

const draftLayouts: TypographyDraftLayoutType[] = [
  "left_hero",
  "center_focus",
  "split_panel",
  "card_stack",
  "cta_emphasis",
  "meta_first",
  "editorial_whitespace",
  "dark_center",
  "trust_panel",
  "beginner_soft",
  "left_hero",
  "split_panel",
  "card_stack",
  "trust_panel",
  "beginner_soft",
];

const ideaSeeds: Record<string, Array<Pick<IdeaDirection, "name" | "mainCopy" | "subCopy" | "cta" | "intent" | "tone" | "layoutHint" | "risk" | "bestFor">>> = {
  seminar_problem_01: [
    idea("最初の壁をほどく", "AI活用、何から始める？", "明日から使える実践ステップを60分で解説", "無料で参加する", "不安を入口にして参加の心理的ハードルを下げる。", "やさしい / 共感", "左寄せで問いを大きく見せる", "一般的に見える可能性", "初心者向け"),
    idea("忙しい人の一歩", "忙しくても始められるAI活用", "要点だけを60分で整理", "無料で参加する", "時間がない人に短時間の価値を伝える。", "親しみ / 時短", "余白型で情報を絞る", "具体性が弱くなる可能性", "ビジネスパーソン"),
    idea("導入前の不安整理", "AI導入前に知っておきたいこと", "最初につまずくポイントをやさしく解説", "無料で参加する", "導入前の不安を言語化して安心感を出す。", "安心 / 丁寧", "カード型で不安と解決を並べる", "少し堅く見える可能性", "初学者"),
    idea("はじめの質問", "AI活用、まず何を知るべき？", "現場で迷わない基本を60分で", "参加する", "問いかけで自分ごと化する。", "問い / 実用", "中央配置で問いを強く見せる", "問いだけだと弱い可能性", "導入検討者"),
    idea("ツール選び以前", "ツール選びの前に、AI活用の型を知る", "実践例から学ぶ最初のステップ", "無料で視聴する", "ツールではなく考え方を学ぶ価値を出す。", "実務 / 誠実", "左右分割で型と実例を分ける", "文字量が増える可能性", "実務担当者"),
    idea("小さく試す", "AI活用は、小さく始めればいい", "明日から試せる業務改善のヒント", "無料で参加する", "大きな導入ではなく小さな実践として見せる。", "前向き / 低負荷", "CTA強調で行動につなげる", "軽く見える可能性", "未経験者"),
  ],
  seminar_benefit_02: [
    idea("60分価値", "60分でわかるAI活用の第一歩", "業務改善に使える考え方と実践例を紹介", "今すぐ申し込む", "参加メリットを短く明確に伝える。", "明快 / 告知", "左寄せでベネフィットを大きく置く", "広告感が強くなる可能性", "申込重視"),
    idea("得られる内容", "この60分で、AI活用の全体像が見える", "要点、実例、始め方をまとめて整理", "申し込む", "得られる内容を具体的に見せる。", "整理 / 実利", "右側にチェックリストを置く", "説明的になりすぎる可能性", "比較検討中"),
    idea("明日から実践", "明日から使えるAI活用入門", "まず試すべき業務改善ステップ", "無料で参加する", "即実践できる価値を見せる。", "実践 / 前向き", "CTA強調型", "やや定番に見える可能性", "実務者"),
    idea("短時間学習", "短時間で学ぶAI業務改善", "忙しい人のための実践セミナー", "今すぐ申し込む", "忙しさに配慮した参加理由を作る。", "時短 / 効率", "メタ情報強調型", "急ぎすぎた印象", "多忙な担当者"),
    idea("参加後の一歩", "参加後に、最初の一手が見える", "AI活用を業務に落とし込む考え方", "詳細を見る", "学んだ後の行動を想像させる。", "納得 / 具体", "上下分割でBefore/Afterを見せる", "抽象的になる可能性", "導入担当者"),
    idea("迷わない導入", "迷わず始めるAI活用の基本", "実例でわかる導入ステップ", "無料で視聴する", "迷いを減らすメリットを出す。", "安心 / 実用", "カード型で3ポイントを並べる", "少し硬い可能性", "BtoB担当者"),
  ],
  seminar_practical_03: [
    idea("業務改善", "明日から使えるAI業務改善", "現場で試せるプロンプト活用と導入ステップ", "無料で視聴する", "実務メリットを強く出す。", "実務 / 具体", "濃色背景で専門性を出す", "情報量が多くなる可能性", "実務者"),
    idea("プロンプト活用", "プロンプト活用、まずはここから", "現場で使える考え方と実践例", "参加する", "具体的なテーマで参加理由を作る。", "具体 / 技術", "中央配置でテーマを強調", "専門的に見えすぎる可能性", "現場担当者"),
    idea("導入ステップ", "AI導入を小さく進める3ステップ", "業務改善につなげる実践ウェビナー", "無料で参加する", "手順がある安心感を出す。", "整理 / 実践", "導入ステップ型", "説明量が増える可能性", "導入推進者"),
    idea("実例中心", "実例でわかるAI業務改善", "明日から試せる使い方を紹介", "無料で視聴する", "実例があることで学習価値を高める。", "実例 / 信頼", "左右分割で実例カードを置く", "見た目が資料っぽくなる可能性", "実務者"),
    idea("現場で試す", "現場で試せるAI活用の型", "小さく始める業務改善のヒント", "詳細を見る", "抽象論ではなく現場での使い方を示す。", "現場 / 誠実", "白背景で資料感を出す", "地味に見える可能性", "BtoB担当者"),
    idea("使える入門", "使えるAI入門、60分で整理", "プロンプトと導入の基本をまとめて解説", "申し込む", "実用性と短時間を両立する。", "実用 / 時短", "CTA強調型", "広告感が強い可能性", "申込重視"),
  ],
  seminar_trust_04: [
    idea("信頼導入", "現場で使えるAI活用セミナー", "導入前の不安を整理し、実践までつなげる", "詳細を見る", "BtoB向けの安心感を出す。", "信頼 / 落ち着き", "余白型で堅実に見せる", "印象が弱くなる可能性", "企業向け"),
    idea("社内共有", "社内で説明しやすいAI活用の基本", "導入前に整理したいポイントを解説", "詳細を見る", "社内共有しやすいテーマにする。", "堅実 / 共有", "資料風カード型", "やや硬い可能性", "管理職"),
    idea("導入判断", "AI活用の導入判断に必要なこと", "不安と実践ステップを60分で整理", "無料で参加する", "判断材料としての価値を見せる。", "判断 / 信頼", "左右分割で課題と判断軸を出す", "参加ハードルが上がる可能性", "管理職"),
    idea("安心設計", "不安を整理して始めるAI活用", "実践までつなげる導入セミナー", "詳細を見る", "不安解消と実践の両方を見せる。", "安心 / 実践", "上品なブルー基調", "弱く見える可能性", "BtoB担当者"),
    idea("現場視点", "現場視点で考えるAI活用", "業務改善につなげる基本と実例", "参加する", "現場で使えることを信頼材料にする。", "現場 / 信頼", "白背景で読みやすく整理", "面白みに欠ける可能性", "実務責任者"),
    idea("堅実ウェビナー", "堅実に始めるAI活用ウェビナー", "導入前の疑問を60分で整理", "申し込む", "落ち着いた参加理由を作る。", "堅実 / 丁寧", "メタ情報強調型", "地味に見える可能性", "企業研修"),
  ],
  seminar_beginner_05: [
    idea("初心者歓迎", "AI初心者のための実践ウェビナー", "専門知識なしではじめる、最初の一歩", "無料で参加する", "初心者でも参加しやすい安心感を出す。", "やさしい / 入門", "丸みのあるカード型", "差別化が弱い可能性", "未経験者"),
    idea("専門知識なし", "専門知識なしで始めるAI活用", "はじめの一歩をやさしく解説", "無料で視聴する", "参加ハードルを下げる。", "安心 / やさしい", "柔らかい色の中央配置", "軽く見える可能性", "初学者"),
    idea("はじめの一歩", "AI活用、はじめの一歩", "まず知るべき基本を60分で", "参加する", "最初の一歩としてわかりやすくする。", "入門 / 明快", "見出し一点突破", "ありきたりな印象", "初心者"),
    idea("置いていかない", "初めてでも置いていかないAI入門", "基本から実践までやさしく整理", "無料で参加する", "心理的安全性を訴求する。", "安心 / 丁寧", "余白大きめ", "やや長い", "未経験者"),
    idea("やさしい実践", "やさしく学ぶAI業務改善", "専門用語を抑えて実例で解説", "詳細を見る", "難しさを抑えて実務価値を出す。", "やさしい / 実務", "上下分割", "実務感が弱い可能性", "初学者"),
    idea("入門ウェビナー", "AI活用入門ウェビナー", "今日から試せる基本を学ぶ", "無料で視聴する", "短く覚えやすい訴求にする。", "入門 / 軽快", "CTA強調型", "情報が少ない可能性", "広い初心者層"),
  ],
};

export function createDemoStageWorkflow(params: {
  directions: Direction[];
  refinedSvgCandidates: SvgCandidate[];
  comparisonResult?: ComparisonResult;
  backgroundResult?: BackgroundResult;
  typographyDrafts?: TypographyDraft[];
}): StageWorkflowData {
  const ideaDirections = createIdeaDirections(params.directions);
  const typographyDrafts = params.typographyDrafts?.length ? params.typographyDrafts : createTypographyDrafts(ideaDirections);
  const refinedSvgCandidates = params.refinedSvgCandidates.map((candidate, index) => ({
    ...candidate,
    sourceDraftId: typographyDrafts.filter((draft) => draft.selectedForRefine)[index]?.id,
    strength: getStrength(index),
    concern: getConcern(index),
  }));
  const backgroundVariations = createBackgroundVariations(params.backgroundResult);
  const primaryCandidate =
    refinedSvgCandidates.find((candidate) => candidate.id === params.comparisonResult?.recommendation.primaryFrameId) ?? refinedSvgCandidates[0];
  const finalCandidate: FinalCandidate = {
    id: "final_demo_01",
    name: "Final Candidate",
    refinedCandidateId: primaryCandidate?.id ?? "seminar_problem_01",
    selectedBackgroundId: backgroundVariations.find((variation) => variation.selected)?.id,
    reason: "課題共感型は初心者向けセミナーの入口として分かりやすく、背景を加えても文字とCTAを編集可能に保ちやすいため。",
    editableLayers: ["見出しテキスト", "サブコピー", "CTA", "日時情報", "背景レイヤー"],
    nextAdjustments: ["開催日時を実データに差し替える", "ブランドカラーへ寄せる", "CTA文言を申し込み導線に合わせる"],
  };
  const finalCandidates = createFinalCandidates(refinedSvgCandidates, backgroundVariations, primaryCandidate, finalCandidate);

  return {
    ideaDirections,
    typographyDrafts,
    refinedSvgCandidates,
    demoComparison: createDemoComparison(),
    backgroundVariations,
    finalCandidate,
    finalCandidates,
  };
}

function createFinalCandidates(
  refinedCandidates: RefinedSvgCandidate[],
  backgroundVariations: BackgroundVariation[],
  primaryCandidate: RefinedSvgCandidate | undefined,
  legacyFinalCandidate: FinalCandidate,
): FinalCandidate[] {
  const fallbackCandidate = primaryCandidate ?? refinedCandidates[0];
  const candidateQueue = [primaryCandidate, refinedCandidates[1], refinedCandidates[2]].filter(Boolean) as RefinedSvgCandidate[];
  const variantNotes = [
    {
      label: "A",
      name: "Final A / Quiet Tech",
      reason: "背景の余白とやわらかい奥行きを生かし、初学者が最初に読むコピーを落ち着いて見せる完成案です。",
      compositionNotes: ["左側に主コピーの読み始めを作る", "CTA周辺の背景コントラストを抑える", "テック感は薄く、信頼感を優先する"],
      nextAdjustments: ["開催日時を実データへ差し替える", "ブランドカラーの緑をCTAだけに寄せる", "背景の明度をFigma上で微調整する"],
    },
    {
      label: "B",
      name: "Final B / Structured Geometry",
      reason: "幾何学的な背景を使い、情報整理や実務感を強めた案です。比較検討中のユーザーに判断材料を渡しやすくします。",
      compositionNotes: ["右側に補足情報のまとまりを作る", "背景パターンで視線の流れを作る", "見出しとCTAの距離を近づける"],
      nextAdjustments: ["背景線が文字に近い箇所を避ける", "サブコピーを短くして実務感を残す", "CTAの横幅を申込文言に合わせる"],
    },
    {
      label: "C",
      name: "Final C / Editorial Texture",
      reason: "紙面感のある写真・質感を生かし、セミナー告知を読み物として見せる案です。広告感を抑えたい掲載面に向きます。",
      compositionNotes: ["余白を広く取り、読み物感を出す", "文字量を絞って写真の質感を見せる", "CTAは控えめだが見失わない位置に置く"],
      nextAdjustments: ["背景の粒状感をブランドトーンに合わせる", "見出しの改行位置を最終コピーで調整する", "SNS掲載時の縮小表示を確認する"],
    },
  ];

  return backgroundVariations.slice(0, 3).map((background, index) => {
    const notes = variantNotes[index] ?? variantNotes[0];
    const candidate = candidateQueue[index] ?? fallbackCandidate;
    return {
      ...legacyFinalCandidate,
      id: `final_demo_${notes.label.toLowerCase()}`,
      name: notes.name,
      variantLabel: notes.label,
      refinedCandidateId: candidate?.id ?? fallbackCandidate?.id ?? legacyFinalCandidate.refinedCandidateId,
      selectedBackgroundId: background.id,
      reason: notes.reason,
      backgroundDirection: background.direction,
      compositionNotes: notes.compositionNotes,
      editableLayers: ["見出しテキスト", "サブコピー", "CTA", "日時情報", "背景画像レイヤー"],
      nextAdjustments: notes.nextAdjustments,
    };
  });
}

function createIdeaDirections(directions: Direction[]): IdeaDirection[] {
  return directions.flatMap((direction) => {
    const seeds = ideaSeeds[direction.id] ?? [];
    return seeds.map((seed, index) => ({
      id: `idea_${direction.id}_${index + 1}`,
      ...seed,
      status: index < 3 ? "selected_for_typography" : index === 3 ? "merged" : "rejected",
      selectionReason: index < 3 ? "方向性の違いが明確で、文字組み検証に残す価値がある。" : index === 3 ? "近い訴求に統合。" : "5案比較では差が弱いため保留。",
    }));
  });
}

function createTypographyDrafts(ideas: IdeaDirection[]): TypographyDraft[] {
  return ideas
    .filter((idea) => idea.status === "selected_for_typography")
    .slice(0, 15)
    .map((idea, index) => {
      const id = `draft_${String(index + 1).padStart(2, "0")}`;
      const layoutType = draftLayouts[index] ?? "left_hero";
      const selectedForRefine = [0, 4, 8, 11, 14].includes(index);
      const evaluationMemo = getDraftEvaluationMemo(layoutType, selectedForRefine);
      const draftInput: LayoutDraftInput = {
        id,
        sourceIdeaId: idea.id,
        contentType: "seminar_banner",
        layoutType,
        directionName: idea.name,
        mainCopy: idea.mainCopy,
        subCopy: idea.subCopy,
        cta: idea.cta,
        date: "6.18 WED",
        time: "14:00 Online",
        tone: idea.tone,
        priority: ["main", "sub", "date", "cta"],
        evaluationMemo,
        selectedForRefine,
      };

      return {
        id,
        sourceIdeaId: idea.id,
        name: `Draft ${String(index + 1).padStart(2, "0")}`,
        directionName: idea.name,
        layoutType,
        svg: createTypographyDraftSvg(draftInput),
        evaluationMemo,
        selectedForRefine,
      };
    });
}

function getDraftEvaluationMemo(layoutType: TypographyDraftLayoutType, selectedForRefine: boolean): string {
  const base: Record<TypographyDraftLayoutType, string> = {
    left_hero: "左から素直に読めるか、主見出しの改行を確認します。",
    center_focus: "中央配置で主見出しが強く見えるかを確認します。",
    split_panel: "主見出しと補助情報の左右バランスを確認します。",
    card_stack: "補助情報を分けた時に読みやすいかを確認します。",
    cta_emphasis: "CTAはボタン化せず、文言として位置と強さを確認します。",
    editorial_whitespace: "余白を広く取り、広告感を抑えた読み方を確認します。",
    dark_center: "濃色背景でも文字階層が崩れないかを確認します。",
    trust_panel: "BtoB向けに落ち着いた情報整理ができるか確認します。",
    beginner_soft: "初心者向けのやわらかさと見出しの読みやすさを確認します。",
    meta_first: "日時を先に置いた時の読み順を確認します。",
  };
  return `${base[layoutType]}${selectedForRefine ? " 5案化の候補として残します。" : " 比較用のドラフトとして整理します。"}`;
}

function createBackgroundVariations(backgroundResult?: BackgroundResult): BackgroundVariation[] {
  const target = backgroundResult?.brief.targetFrameName ?? "Primary案";
  const generatedImage = getBackgroundDataUrl(backgroundResult);
  return [
    {
      id: "bg_soft_tech",
      name: backgroundResult?.styleName ?? "Quiet Tech Texture",
      direction: `${target} の文字領域を空け、控えめな奥行きで信頼感を足す背景。`,
      svg: backgroundResult?.svg ?? createBackgroundSvg("#F6F8F7", "#DCEBE4", "#2F7D65"),
      imageDataUrl: generatedImage ?? softGradientBackgroundDataUrl,
      selected: true,
    },
    {
      id: "bg_geometry",
      name: "Subtle Geometry",
      direction: "右側に控えめな幾何学パターンを置き、中央の文字可読性を保つ。",
      svg: createBackgroundSvg("#F8FAFC", "#E7EEF0", "#5B8DEF"),
      imageDataUrl: subtleGeometryBackgroundDataUrl,
      selected: false,
    },
    {
      id: "bg_editorial",
      name: "Editorial Texture",
      direction: "紙面感のある薄い質感で、セミナー告知を落ち着いて見せる。",
      svg: createBackgroundSvg("#FAFAF7", "#E5E7EB", "#2563EB"),
      imageDataUrl: editorialPaperBackgroundDataUrl,
      selected: false,
    },
  ];
}

function getBackgroundDataUrl(backgroundResult?: BackgroundResult): string | undefined {
  if (!backgroundResult) return undefined;
  if (backgroundResult.imageUrl?.startsWith("data:")) return backgroundResult.imageUrl;
  if (backgroundResult.base64) return `data:image/png;base64,${backgroundResult.base64}`;
  return undefined;
}

function createDemoComparison(): DemoComparison {
  return {
    summary: "5案は、初心者向けの入口、参加メリット、実務性、BtoB信頼感、やさしい参加感で役割が分かれています。Demo Modeでは課題共感型をPrimary、参加メリット型をSecondaryとして扱います。",
    primaryName: "課題共感型",
    secondaryName: "参加メリット型",
    selectionReason: "初心者向けセミナーの最初の接点として、参加前の不安を言語化する課題共感型が最もクリック理由を作りやすいため。",
    rows: [
      {
        name: "課題共感型",
        role: "入口を作る",
        layout: "左寄せ / やさしい導入",
        strength: "不安のある人が自分ごと化しやすい。",
        concern: "一般論に見えないよう、背景で現場感を少し足したい。",
        bestFor: "初心者向け導入セミナー",
      },
      {
        name: "参加メリット型",
        role: "申込を促す",
        layout: "左右分割 / 告知感強め",
        strength: "60分で得られる内容が明確。",
        concern: "申込訴求が前に出るため、初回接点では少し広告感が強い。",
        bestFor: "申込重視の告知",
      },
      {
        name: "実務ノウハウ型",
        role: "実用性を示す",
        layout: "中央配置 / 濃色背景",
        strength: "業務改善に使える印象が強い。",
        concern: "情報量が増えると読みづらい。",
        bestFor: "実務者向け",
      },
      {
        name: "信頼感型",
        role: "社内共有しやすい",
        layout: "余白型 / BtoB",
        strength: "落ち着いていて企業向けに使いやすい。",
        concern: "やや地味に見える可能性。",
        bestFor: "企業向け・管理職向け",
      },
      {
        name: "初心者歓迎型",
        role: "参加ハードルを下げる",
        layout: "やわらかい色 / 丸み",
        strength: "初学者が安心して参加しやすい。",
        concern: "差別化が弱くなる可能性。",
        bestFor: "未経験者・初学者",
      },
    ],
  };
}

function createBackgroundSvg(start: string, end: string, accent: string): string {
  return `<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg" fill="none">
    <defs><linearGradient id="g" x1="0" y1="0" x2="800" y2="450" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${start}"/><stop offset="1" stop-color="${end}"/></linearGradient></defs>
    <rect width="800" height="450" rx="24" fill="url(#g)"/>
    <circle cx="680" cy="110" r="82" fill="${accent}" opacity="0.16"/>
    <circle cx="720" cy="360" r="120" fill="${accent}" opacity="0.10"/>
    <rect x="590" y="70" width="120" height="120" rx="28" fill="#FFFFFF" opacity="0.22"/>
    <text x="56" y="398" fill="#64748B" font-size="16" font-weight="700" font-family="Inter, 'Noto Sans JP', sans-serif">Background only / text layers remain editable</text>
  </svg>`;
}

function idea(
  name: string,
  mainCopy: string,
  subCopy: string,
  cta: string,
  intent: string,
  tone: string,
  layoutHint: string,
  risk: string,
  bestFor: string,
) {
  return { name, mainCopy, subCopy, cta, intent, tone, layoutHint, risk, bestFor };
}

function getStrength(index: number): string {
  return ["初心者向けの入口が分かりやすい。", "参加メリットが明確で申込導線に向く。", "実務感が強く、学ぶ内容が伝わる。", "BtoB向けに信頼感がある。", "やわらかく参加ハードルが低い。"][index] ?? "比較しやすい方向性です。";
}

function getConcern(index: number): string {
  return ["一般的に見えないよう、背景で少し個性を足したい。", "広告感が強くなりすぎないよう余白を保ちたい。", "情報量が多いため文字サイズに注意。", "地味になりすぎないようアクセントが必要。", "やさしすぎて弱くならないようCTAを明確にする。"][index] ?? "仕上げ時に可読性を確認したい。";
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
