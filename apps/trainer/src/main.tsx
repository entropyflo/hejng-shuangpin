import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

const root = document.getElementById("root");

if (!root) {
  throw new Error("缺少应用根节点");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
