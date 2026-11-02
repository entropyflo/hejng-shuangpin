import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FakeAdapter, type RunResult } from "./adapters.js";
import { acquireLock } from "./lock.js";
import { Coordinator } from "./runtime.js";

const ok = (output = "ok"): RunResult => ({ ok: true, code: 0, output });
const fail = (output: string): RunResult => ({ ok: false, code: 1, output });

function setup(codex: RunResult[], workbuddy: RunResult[], maxAttempts = 6) {
  const directory = mkdtempSync(join(tmpdir(), "coord-run-"));
  const sleeps: number[] = [];
  const coordinator = new Coordinator({
    statePath: join(directory, "state.json"),
    lockPath: join(directory, "lock"),
    adapters: {
      codex: new FakeAdapter("codex", codex),
      workbuddy: new FakeAdapter("workbuddy", workbuddy),
    },
    now: () => 1000,
    sleep: async (ms) => {
      sleeps.push(ms);
    },
    maxAttempts,
  });
  return { coordinator, sleeps, directory };
}

describe("协调器运行", () => {
  it("一次成功即结束并记录历史", async () => {
    const { coordinator } = setup([ok()], []);
    const summary = await coordinator.run("do it", process.cwd());
    expect(summary.ok).toBe(true);
    expect(summary.state.phase).toBe("done");
    expect(summary.state.history.map((entry) => entry.event)).toContain("run-succeeded");
  });

  it("额度耗尽时切换到 WorkBuddy 接力", async () => {
    const { coordinator } = setup([fail("usage limit reached")], [ok("handoff-ok")]);
    const summary = await coordinator.run("do it", process.cwd());
    expect(summary.ok).toBe(true);
    expect(summary.state.activeAgent).toBe("workbuddy");
    const events = summary.state.history.map((entry) => entry.event);
    expect(events).toContain("failure-quota");
    expect(events).toContain("handoff-to-workbuddy");
  });

  it("网络错误按退避重试后成功", async () => {
    const { coordinator, sleeps } = setup([fail("ETIMEDOUT"), fail("ETIMEDOUT"), ok()], []);
    const summary = await coordinator.run("do it", process.cwd());
    expect(summary.ok).toBe(true);
    expect(sleeps).toEqual([500, 1000]);
  });

  it("认证失败直接暂停", async () => {
    const { coordinator } = setup([fail("401 Unauthorized")], []);
    const summary = await coordinator.run("do it", process.cwd());
    expect(summary.ok).toBe(false);
    expect(summary.state.phase).toBe("paused");
    expect(summary.reason).toContain("认证");
  });

  it("用户暂停后不会自动复工", async () => {
    const { coordinator } = setup([ok()], []);
    coordinator.pause();
    const summary = await coordinator.run("do it", process.cwd());
    expect(summary.ok).toBe(false);
    expect(summary.reason).toContain("已暂停");
  });

  it("已有写者时拒绝启动", async () => {
    const { coordinator, directory } = setup([ok()], []);
    const lock = acquireLock(join(directory, "lock"), {
      pid: process.pid,
      startedAt: 1000,
      owner: "other",
    });
    expect(lock.ok).toBe(true);
    const summary = await coordinator.run("do it", process.cwd());
    expect(summary.ok).toBe(false);
    expect(summary.reason).toContain("已有写者");
  });

  it("双方都额度耗尽时在达到上限后阻塞", async () => {
    const { coordinator } = setup(
      [fail("quota"), fail("quota"), fail("quota")],
      [fail("quota"), fail("quota"), fail("quota")],
      4,
    );
    const summary = await coordinator.run("do it", process.cwd());
    expect(summary.ok).toBe(false);
    expect(summary.state.phase).toBe("blocked");
  });
});
