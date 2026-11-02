import { describe, expect, it } from "vitest";
import { codeBuddyArgs } from "./adapters.js";

describe("CodeBuddy 参数", () => {
  it("默认非交互、无工具、单轮", () => {
    const args = codeBuddyArgs();
    expect(args).toContain("-p");
    expect(args).toContain("--no-session-persistence");
    expect(args).toContain("--max-turns");
    expect(args[args.indexOf("--tools") + 1]).toBe("");
    expect(args).not.toContain("--port");
  });

  it("可指定本地服务端口，避免与应用内代理端口冲突", () => {
    const args = codeBuddyArgs({ port: 61234 });
    expect(args[args.indexOf("--port") + 1]).toBe("61234");
  });
});
