import type { ContentType } from "./content";

export type CopySet = {
  main: string;
  sub: string;
  headline: string;
  subheadline?: string;
  body?: string;
  cta?: string;
  notes?: string[];
};

export type LayoutBrief = {
  id: string;
  contentType: ContentType;
  title: string;
  description: string;
  composition: string;
  hierarchy: string[];
  constraints?: string[];
};

export type StyleBrief = {
  mood: string;
  palette: string[];
  typography: string;
  visualMotifs?: string[];
};

export type Direction = {
  id: string;
  contentType: ContentType;
  title: string;
  name?: string;
  summary: string;
  intent: string;
  layoutType: string;
  tone: string[];
  copy: CopySet;
  layoutBrief: LayoutBrief;
  styleBrief: StyleBrief;
  rationale?: string;
  riskNote?: string;
  tags?: string[];
};
