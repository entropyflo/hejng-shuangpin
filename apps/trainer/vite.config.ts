import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = join(directory, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function serviceWorkerPlugin(): Plugin {
  return {
    name: "xiaohe-service-worker",
    apply: "build",
    closeBundle() {
      const root = process.cwd();
      const outDir = join(root, "dist");
      const files = walk(outDir).filter((file) => !file.endsWith("sw.js"));
      const precache = [
        "/",
        ...files.map((file) => `/${relative(outDir, file).split("\\").join("/")}`),
      ].sort();
      const version = createHash("sha256").update(precache.join("|")).digest("hex").slice(0, 12);
      const template = readFileSync(join(root, "sw.template.js"), "utf8");
      const output = template
        .replace("__VERSION__", version)
        .replace("__PRECACHE__", JSON.stringify(precache, null, 2));
      writeFileSync(join(outDir, "sw.js"), output);
    },
  };
}

export default defineConfig({
  plugins: [react(), serviceWorkerPlugin()],
  test: {
    environment: "node"
  }
});
