import { spawn } from "node:child_process";
import type { AgentName } from "./state.js";

export type TaskInput = { prompt: string; cwd: string };
export type RunResult = { ok: boolean; code: number; output: string };

export interface AgentAdapter {
  name: AgentName;
  run(task: TaskInput): Promise<RunResult>;
}

export class FakeAdapter implements AgentAdapter {
  private readonly results: RunResult[];

  constructor(
    readonly name: AgentName,
    results: RunResult[] = [],
  ) {
    this.results = [...results];
  }

  async run(): Promise<RunResult> {
    return this.results.shift() ?? { ok: true, code: 0, output: "fake-ok" };
  }
}

export type CommandSpec = {
  command: string;
  args: string[];
  promptAsArg?: boolean;
  timeoutMs?: number;
};

export function createCommandAdapter(name: AgentName, spec: CommandSpec): AgentAdapter {
  return {
    name,
    run(task) {
      return new Promise<RunResult>((resolve) => {
        const args = spec.promptAsArg === false ? spec.args : [...spec.args, task.prompt];
        const child = spawn(spec.command, args, { cwd: task.cwd, stdio: ["ignore", "pipe", "pipe"] });
        let output = "";
        const timer = setTimeout(() => child.kill("SIGTERM"), spec.timeoutMs ?? 120_000);

        child.stdout.on("data", (chunk) => {
          output += String(chunk);
        });
        child.stderr.on("data", (chunk) => {
          output += String(chunk);
        });
        child.on("error", (error) => {
          clearTimeout(timer);
          resolve({ ok: false, code: -1, output: String(error) });
        });
        child.on("close", (code) => {
          clearTimeout(timer);
          resolve({ ok: code === 0, code: code ?? -1, output });
        });
      });
    },
  };
}

export function codexAdapter(options: { command?: string; timeoutMs?: number } = {}): AgentAdapter {
  return createCommandAdapter("codex", {
    command: options.command ?? "codex",
    args: ["exec", "--ephemeral", "--json", "--sandbox", "read-only"],
    timeoutMs: options.timeoutMs,
  });
}

export function codeBuddyAdapter(options: { command?: string; timeoutMs?: number } = {}): AgentAdapter {
  return createCommandAdapter("workbuddy", {
    command: options.command ?? "codebuddy",
    args: ["-p", "--no-session-persistence", "--tools", "", "--output-format", "stream-json", "--max-turns", "1"],
    timeoutMs: options.timeoutMs,
  });
}
