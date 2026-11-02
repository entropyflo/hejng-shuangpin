import { randomUUID } from "node:crypto";
import { createServer, type Server } from "node:http";
import type { Coordinator } from "./runtime.js";

export type ConsoleHandle = {
  server: Server;
  token: string;
};

const PAGE = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>鹤径协调器</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; background: #f3efe4; color: #17332f; }
  main { max-width: 720px; margin: 0 auto; background: #fffdf7; border: 1px solid #d8d2c2; border-radius: 18px; padding: 24px; }
  h1 { font-size: 1.5rem; margin: 0 0 8px; }
  pre { background: #eee9db; padding: 16px; border-radius: 12px; overflow: auto; font-size: 12px; }
  button { margin-right: 8px; padding: 8px 14px; border-radius: 999px; border: 1px solid #173f3a; background: #173f3a; color: #f7f3e9; cursor: pointer; }
  button.secondary { background: transparent; color: #173f3a; }
  p.hint { color: #49605b; font-size: 13px; }
</style>
</head>
<body>
<main>
  <h1>鹤径协调器</h1>
  <p class="hint">仅监听 127.0.0.1；写操作需要本页注入的 token。</p>
  <div>
    <button id="pause">暂停</button>
    <button id="resume" class="secondary">恢复</button>
    <button id="refresh" class="secondary">刷新状态</button>
  </div>
  <pre id="state">读取中…</pre>
</main>
<script>
const token = document.querySelector('meta[name="coord-token"]')?.content ?? "";
async function refresh() {
  const response = await fetch("/api/status");
  document.getElementById("state").textContent = JSON.stringify(await response.json(), null, 2);
}
async function act(path) {
  await fetch(path, { method: "POST", headers: { "x-coord-token": token } });
  await refresh();
}
document.getElementById("pause").onclick = () => act("/api/pause");
document.getElementById("resume").onclick = () => act("/api/resume");
document.getElementById("refresh").onclick = refresh;
refresh();
</script>
</body>
</html>`.replace("<head>", '<head>\n<meta name="coord-token" content="__TOKEN__" />');

function sendJson(response: import("node:http").ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

export function createConsoleServer(coordinator: Coordinator): ConsoleHandle {
  const token = randomUUID();

  const server = createServer((request, response) => {
    const origin = request.headers.origin;
    const host = request.headers.host;
    if (origin && host && origin !== `http://${host}`) {
      sendJson(response, 403, { error: "origin-not-allowed" });
      return;
    }

    const url = new URL(request.url ?? "/", `http://${host ?? "127.0.0.1"}`);

    if (request.method === "GET" && url.pathname === "/") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      response.end(PAGE.replace("__TOKEN__", token));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/status") {
      sendJson(response, 200, coordinator.status());
      return;
    }

    if (request.method === "POST" && (url.pathname === "/api/pause" || url.pathname === "/api/resume")) {
      if (request.headers["x-coord-token"] !== token) {
        sendJson(response, 401, { error: "missing-token" });
        return;
      }
      const state = url.pathname === "/api/pause" ? coordinator.pause() : coordinator.resume();
      sendJson(response, 200, state);
      return;
    }

    sendJson(response, 404, { error: "not-found" });
  });

  return { server, token };
}
