import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initialState, loadState, saveState, transition } from "./state.js";

function tempFile(name = "state.json"): string {
  return join(mkdtempSync(join(tmpdir(), "coord-state-")), name);
}

describe("状态机", () => {
  it("初始状态为空闲并记录初始化事件", () => {
    const state = initialState(1000);
    expect(state.phase).toBe("idle");
    expect(state.activeAgent).toBe("codex");
    expect(state.history[0].event).toBe("initialized");
  });

  it("转换会更新时间与历史", () => {
    const next = transition(initialState(1000), { phase: "running" }, "run-started", 2000);
    expect(next.phase).toBe("running");
    expect(next.updatedAt).toBe(2000);
    expect(next.history.at(-1)).toEqual({ at: 2000, event: "run-started" });
  });

  it("历史最多保留 60 条", () => {
    let state = initialState(0);
    for (let index = 0; index < 80; index += 1) {
      state = transition(state, {}, `event-${index}`, index);
    }
    expect(state.history).toHaveLength(60);
    expect(state.history.at(-1)?.event).toBe("event-79");
  });

  it("原子写入后可读回", () => {
    const path = tempFile();
    const state = transition(initialState(1), { phase: "paused" }, "paused", 2);
    saveState(path, state);
    expect(loadState(path, 0)).toEqual(state);
  });

  it("文件损坏时回退到初始状态", () => {
    const path = tempFile();
    writeFileSync(path, "{broken");
    expect(loadState(path, 5).phase).toBe("idle");
  });

  it("写入不会留下临时文件", () => {
    const path = tempFile();
    saveState(path, initialState(1));
    expect(readFileSync(path, "utf8")).toContain("\"phase\": \"idle\"");
  });
});
