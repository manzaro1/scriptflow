import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./intents/design_editor/app";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
