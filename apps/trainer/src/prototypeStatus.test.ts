import { describe, expect, it } from "vitest";
import { prototypeStatus } from "./prototypeStatus";

describe("S0 原型状态", () => {
  it("不会把技术骨架误报为正式可用产品", () => {
    expect(prototypeStatus.phase).toBe("S0");
    expect(prototypeStatus.isProductionReady).toBe(false);
  });
});
