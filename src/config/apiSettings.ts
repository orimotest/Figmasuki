// API issuer handoff file.
// Keep real keys out of GitHub. Put values here only in the local build used by the API owner.
// For public distribution, move these credentials behind a server-side proxy instead of bundling them in the Figma plugin.
export const apiSettings = {
  dify: {
    inputOrganizer: {
      url: "",
      apiKey: "",
    },
    ideaExplorer: {
      url: "",
      apiKey: "",
    },
    typographyPlanner: {
      url: "",
      apiKey: "",
    },
    candidateSelector: {
      url: "",
      apiKey: "",
    },
    diagnosis: {
      url: "",
      apiKey: "",
    },
    compare: {
      url: "",
      apiKey: "",
    },
    ideas: {
      url: "",
      apiKey: "",
    },
    draftSelection: {
      url: "",
      apiKey: "",
    },
    typographyDraft: {
      url: "",
      apiKey: "",
    },
    refinedSelection: {
      url: "",
      apiKey: "",
    },
    copy: {
      url: "",
      apiKey: "",
    },
    layout: {
      url: "",
      apiKey: "",
    },
  },
  gemini: {
    apiKey: "",
    textModel: "gemini-2.0-flash",
    imageModel: "gemini-2.0-flash",
    svgModel: "gemini-2.0-flash",
  },
};
