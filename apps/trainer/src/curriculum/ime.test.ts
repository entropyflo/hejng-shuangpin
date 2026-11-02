import { describe, expect, it } from "vitest";
import { evaluateCommitted } from "./ime";

describe("已提交文本判定", () => {
  it("空输入不计正确率也不完成", () => {
    expect(evaluateCommitted("中国", "")).toEqual({
      committed: 0,
      correct: 0,
      wrongAt: null,
      done: false,
      accuracy: 0,
    });
  });

  it("正确前缀被计数且未完成", () => {
    const result = evaluateCommitted("中国", "中");
    expect(result.correct).toBe(1);
    expect(result.done).toBe(false);
    expect(result.wrongAt).toBeNull();
    expect(result.accuracy).toBe(100);
  });

  it("完全一致才算完成", () => {
    const result = evaluateCommitted("中国", "中国");
    expect(result.done).toBe(true);
    expect(result.correct).toBe(2);
    expect(result.accuracy).toBe(100);
  });

  it("错字给出第一个错误位置且降低正确率", () => {
    const result = evaluateCommitted("中国", "中果");
    expect(result.correct).toBe(1);
    expect(result.wrongAt).toBe(1);
    expect(result.done).toBe(false);
    expect(result.accuracy).toBe(50);
  });

  it("超出目标的输入按错字处理", () => {
    const result = evaluateCommitted("中国", "中国人");
    expect(result.correct).toBe(2);
    expect(result.wrongAt).toBe(2);
    expect(result.done).toBe(false);
  });
});
