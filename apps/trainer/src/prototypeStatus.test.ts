import { describe, expect, it } from "vitest";
import { prototypeStatus } from "./prototypeStatus";

describe("S1 验证版状态", () => {
  it("不会把验证版误报为正式可用产品", () => {
    expect(prototypeStatus.phase).toBe("S1");
    expect(prototypeStatus.isProductionReady).toBe(false);
    expect(prototypeStatus.g1Accepted).toBe(false);
  });
});
