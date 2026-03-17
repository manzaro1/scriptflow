import React from "react";
import { createRoot } from "react-dom/client";
import type { DesignEditorIntent } from "@canva/intents/design";
import { App } from "./app";

const designEditor: DesignEditorIntent = {
  render() {
    const root = document.getElementById("root");
    if (root) {
      createRoot(root).render(<App />);
    }
  },
};

export default designEditor;
