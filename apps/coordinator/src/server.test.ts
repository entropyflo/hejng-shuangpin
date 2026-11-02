import { mkdtempSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { FakeAdapter } from "./adapters.js";
import { Coordinator } from "./runtime.js";
import { createConsoleServer } from "./server.js";

const servers: Array<{ close: (callback: () => void) => void }> = [];

function setup() {
  const directory = mkdtempSync(join(tmpdir(), "coord-console-"));
  const coordinator = new Coordinator({
    statePath: join(directory, "state.json"),
    lockPath: join(directory, "lock"),
    adapters: { codex: new FakeAdapter("codex"), workbuddy: new FakeAdapter("workbuddy") },
  });
  const { server, token } = createConsoleServer(coordinator);
  servers.push(server);
  return { server, token, coordinator };
}

async function listen(server: ReturnType<typeof createConsoleServer>["server"]): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        }),
    ),
  );
});

describe("协调器控制台", () => {
  it("返回状态页与 JSON 状态", async () => {
    const { server } = setup();
    const base = await listen(server);

    const page = await fetch(`${base}/`);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("鹤径协调器");

    const status = await fetch(`${base}/api/status`);
    expect(status.status).toBe(200);
    expect(await status.json()).toMatchObject({ phase: "idle" });
  });

  it("缺少 token 的写操作被拒绝", async () => {
    const { server } = setup();
    const base = await listen(server);
    const response = await fetch(`${base}/api/pause`, { method: "POST" });
    expect(response.status).toBe(401);
  });

  it("外部 Origin 被拒绝", async () => {
    const { server, token } = setup();
    const base = await listen(server);
    const response = await fetch(`${base}/api/pause`, {
      method: "POST",
      headers: { "x-coord-token": token, origin: "http://evil.example" },
    });
    expect(response.status).toBe(403);
  });

  it("带 token 的暂停生效", async () => {
    const { server, token, coordinator } = setup();
    const base = await listen(server);
    const response = await fetch(`${base}/api/pause`, {
      method: "POST",
      headers: { "x-coord-token": token },
    });
    expect(response.status).toBe(200);
    expect(coordinator.status().phase).toBe("paused");
  });

  it("未知路径返回 404", async () => {
    const { server } = setup();
    const base = await listen(server);
    expect((await fetch(`${base}/nope`)).status).toBe(404);
  });
});
