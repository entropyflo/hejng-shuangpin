import { describe, expect, it } from "vitest";
import { classifyFailure, decide } from "./policy.js";

describe("故障分类", () => {
  it("识别额度耗尽", () => {
    expect(classifyFailure("usage limit reached")).toBe("quota");
    expect(classifyFailure("HTTP 429 Too Many Requests")).toBe("quota");
    expect(classifyFailure("当前额度不足")).toBe("quota");
  });

  it("识别网络问题", () => {
    expect(classifyFailure("connect ETIMEDOUT")).toBe("network");
    expect(classifyFailure("socket hang up")).toBe("network");
  });

  it("识别测试失败与认证失败", () => {
    expect(classifyFailure("AssertionError: expected 1 to be 2")).toBe("tests");
    expect(classifyFailure("401 Unauthorized")).toBe("auth");
    expect(classifyFailure("请先登录")).toBe("auth");
  });

  it("其他错误归为未知", () => {
    expect(classifyFailure("something odd happened")).toBe("unknown");
  });
});

describe("恢复策略", () => {
  it("额度耗尽直接接力", () => {
    expect(decide("quota", 0)).toEqual({ action: "handoff" });
  });

  it("网络错误指数退避，超过上限暂停", () => {
    expect(decide("network", 0)).toEqual({ action: "retry", delayMs: 500 });
    expect(decide("network", 1)).toEqual({ action: "retry", delayMs: 1000 });
    expect(decide("network", 3)).toMatchObject({ action: "pause" });
  });

  it("测试失败有限重试后暂停", () => {
    expect(decide("tests", 0)).toEqual({ action: "retry", delayMs: 0 });
    expect(decide("tests", 2)).toMatchObject({ action: "pause" });
  });

  it("认证失败立即暂停", () => {
    expect(decide("auth", 0)).toMatchObject({ action: "pause" });
  });

  it("未知错误只重试一次", () => {
    expect(decide("unknown", 0)).toEqual({ action: "retry", delayMs: 0 });
    expect(decide("unknown", 1)).toMatchObject({ action: "pause" });
  });
});
