export type ProductionStage =
  | "idle"
  | "input_ready"
  | "exploring_ideas"
  | "placing_ideas_board"
  | "generating_typography_drafts"
  | "placing_typography_board"
  | "selecting_refined_candidates"
  | "generating_refined_svgs"
  | "placing_refined_board"
  | "running_auto_compare"
  | "placing_compare_board"
  | "generating_backgrounds"
  | "placing_background_board"
  | "placing_final_candidate"
  | "completed"
  | "error";

export type ProcessBoardStage =
  | "project_header"
  | "ideas"
  | "typography_drafts"
  | "refined_svgs"
  | "diagnosis"
  | "compare"
  | "background_variations"
  | "final_candidate";

export type ProductionStatus = {
  stage: ProductionStage;
  startedAt?: string;
  completedAt?: string;
  error?: string;
};

export type FigmaOutputRecord = {
  stage: ProcessBoardStage;
  nodeId?: string;
  placedAt: string;
  status: "placed" | "failed";
};
