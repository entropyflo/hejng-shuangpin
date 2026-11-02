import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

export type AgentName = "codex" | "workbuddy";
export type Phase = "idle" | "running" | "handoff" | "paused" | "blocked" | "done";

export type HistoryEntry = { at: number; event: string; detail?: string };

export type CoordinatorState = {
  version: 1;
  phase: Phase;
  activeAgent: AgentName;
  taskId: string | null;
  attempt: number;
  lastError: string | null;
  updatedAt: number;
  history: HistoryEntry[];
};

const MAX_HISTORY = 60;

export function initialState(now: number, agent: AgentName = "codex"): CoordinatorState {
  return {
    version: 1,
    phase: "idle",
    activeAgent: agent,
    taskId: null,
    attempt: 0,
    lastError: null,
    updatedAt: now,
    history: [{ at: now, event: "initialized" }],
  };
}

export function transition(
  state: CoordinatorState,
  patch: Partial<CoordinatorState>,
  event: string,
  now: number,
): CoordinatorState {
  return {
    ...state,
    ...patch,
    updatedAt: now,
    history: [...state.history, { at: now, event }].slice(-MAX_HISTORY),
  };
}

export function loadState(path: string, now: number): CoordinatorState {
  if (!existsSync(path)) return initialState(now);
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as CoordinatorState;
    if (parsed.version !== 1 || typeof parsed.phase !== "string" || !Array.isArray(parsed.history)) {
      return initialState(now);
    }
    return parsed;
  } catch {
    return initialState(now);
  }
}

export function saveState(path: string, state: CoordinatorState): void {
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  writeFileSync(temporary, JSON.stringify(state, null, 2));
  renameSync(temporary, path);
}
