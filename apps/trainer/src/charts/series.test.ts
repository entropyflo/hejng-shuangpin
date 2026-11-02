import { describe, expect, it } from "vitest";
import { seriesStats, toPoints, toPolyline } from "./series";

describe("折线点生成", () => {
  it("空序列返回空串", () => {
    expect(toPolyline([], 100, 50)).toBe("");
  });

  it("单点居中", () => {
    const points = toPolyline([5], 100, 50, 6);
    expect(points).toBe("50.0,25.0");
  });

  it("两点分居左右且数值大者在上", () => {
    const points = toPolyline([10, 20], 100, 50, 6).split(" ");
    expect(points).toHaveLength(2);
    const [x1, y1] = points[0].split(",").map(Number);
    const [x2, y2] = points[1].split(",").map(Number);
    expect(x1).toBe(6);
    expect(x2).toBe(94);
    expect(y2).toBeLessThan(y1);
  });

  it("全部相等时画在中线", () => {
    const points = toPolyline([7, 7, 7], 100, 50, 6).split(" ");
    for (const point of points) {
      expect(point.split(",")[1]).toBe("25.0");
    }
  });
});

describe("序列统计", () => {
  it("返回最小、最大与最新值", () => {
    expect(seriesStats([3, 9, 5])).toEqual({ min: 3, max: 9, latest: 5 });
  });

  it("空序列返回 null", () => {
    expect(seriesStats([])).toBeNull();
  });
});

describe("点列表", () => {
  it("单点居中且可用于散点", () => {
    expect(toPoints([5], 100, 50, 6)).toEqual([{ x: 50, y: 25 }]);
  });

  it("空序列返回空数组", () => {
    expect(toPoints([], 100, 50)).toEqual([]);
  });
});
