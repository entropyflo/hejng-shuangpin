import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";

document.documentElement.dataset.theme = "light";
document.documentElement.style.colorScheme = "light";


const root = document.getElementById("root");

if (!root) {
  throw new Error("缺少应用根节点");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
