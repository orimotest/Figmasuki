export type ApiWorkflowCredential = {
  url: string;
  apiKey: string;
};

export type RuntimeApiSettings = {
  mode: "demo" | "api";
  dify: {
    inputOrganizer: ApiWorkflowCredential;
    ideaExplorer: ApiWorkflowCredential;
    typographyPlanner: ApiWorkflowCredential;
    candidateSelector: ApiWorkflowCredential;
    diagnosis: ApiWorkflowCredential;
    compare: ApiWorkflowCredential;
  };
  gemini: {
    apiKey: string;
    textModel: string;
    imageModel: string;
    svgModel: string;
  };
};

export const emptyRuntimeApiSettings: RuntimeApiSettings = {
  mode: "demo",
  dify: {
    inputOrganizer: { url: "", apiKey: "" },
    ideaExplorer: { url: "", apiKey: "" },
    typographyPlanner: { url: "", apiKey: "" },
    candidateSelector: { url: "", apiKey: "" },
    diagnosis: { url: "", apiKey: "" },
    compare: { url: "", apiKey: "" },
  },
  gemini: {
    apiKey: "",
    textModel: "gemini-2.0-flash",
    imageModel: "gemini-2.0-flash",
    svgModel: "gemini-2.0-flash",
  },
};
