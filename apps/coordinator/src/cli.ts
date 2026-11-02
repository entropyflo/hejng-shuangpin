#!/usr/bin/env node
import { join } from "node:path";
import { FakeAdapter, codeBuddyAdapter, codexAdapter } from "./adapters.js";
import { Coordinator } from "./runtime.js";
import { createConsoleServer } from "./server.js";

const root = process.cwd();
const statePath = join(root, "runtime", "coordinator-state.json");
const lockPath = join(root, "runtime", "coordinator.lock");

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function has(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function build(execute: boolean): Coordinator {
  return new Coordinator({
    statePath,
    lockPath,
    adapters: execute
      ? { codex: codexAdapter(), workbuddy: codeBuddyAdapter() }
      : { codex: new FakeAdapter("codex"), workbuddy: new FakeAdapter("workbuddy") },
  });
}

const command = process.argv[2] ?? "status";

if (command === "status") {
  console.log(JSON.stringify(build(false).status(), null, 2));
} else if (command === "pause") {
  console.log(JSON.stringify(build(false).pause(), null, 2));
} else if (command === "resume") {
  console.log(JSON.stringify(build(false).resume(), null, 2));
} else if (command === "run") {
  const execute = has("execute");
  const prompt = flag("prompt") ?? "输出 COORD_OK 后结束，不要修改任何文件。";
  if (execute) {
    console.log("以真实 CLI 运行会消耗订阅额度；默认 dry-run，只有显式 --execute 才会调用。");
  }
  const summary = await build(execute).run(prompt, root);
  console.log(JSON.stringify(summary, null, 2));
  process.exit(summary.ok ? 0 : 1);
} else if (command === "console") {
  const port = Number(flag("port") ?? 7788);
  const { server, token } = createConsoleServer(build(false));
  server.listen(port, "127.0.0.1", () => {
    console.log(`协调器控制台：http://127.0.0.1:${port}/`);
    console.log(`写操作 token：${token}`);
  });
} else {
  console.error("用法：coord <status|run|pause|resume|console> [--prompt ...] [--execute] [--port 7788]");
  process.exit(2);
}
