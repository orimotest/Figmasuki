import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { FatalErrorBoundary } from "./components/FatalErrorBoundary";
import "../styles/app.css";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element was not found.");
}

createRoot(root).render(
  <React.StrictMode>
    <FatalErrorBoundary>
      <App />
    </FatalErrorBoundary>
  </React.StrictMode>,
);
