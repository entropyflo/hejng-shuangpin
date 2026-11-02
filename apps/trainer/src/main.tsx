import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { applyTheme, readThemePreference, systemPrefersDark } from "./app/theme";
import "./styles.css";

applyTheme(readThemePreference(window.localStorage), document.documentElement, systemPrefersDark());


const root = document.getElementById("root");

if (!root) {
  throw new Error("缺少应用根节点");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
