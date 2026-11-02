import type { AgentAdapter } from "./adapters.js";
import { acquireLock, releaseLock } from "./lock.js";
import { classifyFailure, decide } from "./policy.js";
import { loadState, saveState, transition, type AgentName, type CoordinatorState } from "./state.js";

export type CoordinatorOptions = {
  statePath: string;
  lockPath: string;
  adapters: Record<AgentName, AgentAdapter>;
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  maxAttempts?: number;
  owner?: string;
};

export type RunSummary = {
  ok: boolean;
  state: CoordinatorState;
  reason?: string;
};

export class Coordinator {
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(private readonly options: CoordinatorOptions) {
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  status(): CoordinatorState {
    return loadState(this.options.statePath, this.now());
  }

  pause(): CoordinatorState {
    const state = transition(this.status(), { phase: "paused" }, "paused-by-user", this.now());
    saveState(this.options.statePath, state);
    return state;
  }

  resume(): CoordinatorState {
    const state = transition(this.status(), { phase: "idle", attempt: 0, lastError: null }, "resumed-by-user", this.now());
    saveState(this.options.statePath, state);
    return state;
  }

  async run(prompt: string, cwd: string): Promise<RunSummary> {
    const lock = acquireLock(
      this.options.lockPath,
      {
        pid: process.pid,
        startedAt: this.now(),
        owner: this.options.owner ?? "coordinator",
      },
      { now: this.now() },
    );

    if (!lock.ok) {
      return {
        ok: false,
        state: this.status(),
        reason: `已有写者持有锁：pid ${lock.holder?.pid ?? "unknown"}`,
      };
    }

    try {
      let state = this.status();
      if (state.phase === "paused") {
        return { ok: false, state, reason: "用户已暂停，不会自动复工" };
      }

      const maxAttempts = this.options.maxAttempts ?? 6;
      state = transition(
        state,
        { phase: "running", taskId: `task-${this.now()}`, attempt: 0, lastError: null },
        "run-started",
        this.now(),
      );
      saveState(this.options.statePath, state);

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const adapter = this.options.adapters[state.activeAgent];
        const result = await adapter.run({ prompt, cwd });

        if (result.ok) {
          state = transition(state, { phase: "done", attempt, lastError: null }, "run-succeeded", this.now());
          saveState(this.options.statePath, state);
          return { ok: true, state };
        }

        const kind = classifyFailure(result.output);
        const decision = decide(kind, attempt);
        state = transition(
          state,
          { lastError: `${kind}: ${result.output.slice(0, 300)}` },
          `failure-${kind}`,
          this.now(),
        );
        saveState(this.options.statePath, state);

        if (decision.action === "pause") {
          state = transition(state, { phase: "paused" }, "paused", this.now());
          saveState(this.options.statePath, state);
          return { ok: false, state, reason: decision.reason };
        }

        if (decision.action === "retry") {
          await this.sleep(decision.delayMs);
          continue;
        }

        const other: AgentName = state.activeAgent === "codex" ? "workbuddy" : "codex";
        state = transition(
          state,
          { phase: "handoff", activeAgent: other, attempt: 0 },
          `handoff-to-${other}`,
          this.now(),
        );
        saveState(this.options.statePath, state);
      }

      state = transition(state, { phase: "blocked" }, "max-attempts", this.now());
      saveState(this.options.statePath, state);
      return { ok: false, state, reason: "达到最大尝试次数，已停止" };
    } finally {
      releaseLock(this.options.lockPath, process.pid);
    }
  }
}
