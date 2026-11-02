import { describe, expect, it } from "vitest";
import { accuracyOf, computeCpm, starRating, starsToText } from "./metrics";

describe("准确率与星级", () => {
  it("空作答准确率为 0", () => {
    expect(accuracyOf(0, 0)).toBe(0);
    expect(accuracyOf(3, 4)).toBe(0.75);
  });

  it("星级按正确率分档，边界值向上取档", () => {
    expect(starRating(1)).toBe(3);
    expect(starRating(0.95)).toBe(3);
    expect(starRating(0.949)).toBe(2);
    expect(starRating(0.85)).toBe(2);
    expect(starRating(0.849)).toBe(1);
    expect(starRating(0.7)).toBe(1);
    expect(starRating(0.699)).toBe(0);
  });

  it("星级文本固定三格", () => {
    expect(starsToText(3)).toBe("★★★");
    expect(starsToText(1)).toBe("★☆☆");
    expect(starsToText(0)).toBe("☆☆☆");
  });
});

describe("CPM", () => {
  it("按正确汉字数与有效分钟计算", () => {
    expect(computeCpm(60, 60_000)).toBe(60);
    expect(computeCpm(30, 30_000)).toBe(60);
    expect(computeCpm(45, 60_000)).toBe(45);
  });

  it("过短或没有正确字时不计算", () => {
    expect(computeCpm(0, 60_000)).toBeNull();
    expect(computeCpm(5, 900)).toBeNull();
  });

  it("四舍五入到整数", () => {
    expect(computeCpm(10, 7_000)).toBe(86);
  });
});
