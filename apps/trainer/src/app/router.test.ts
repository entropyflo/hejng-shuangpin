import { describe, expect, it } from "vitest";
import { NAV_ITEMS, parseRoute, pathFor, type Route } from "./router";

describe("路由解析", () => {
  it("首页支持根路径与 /home", () => {
    expect(parseRoute("/")).toEqual({ name: "home" });
    expect(parseRoute("/home")).toEqual({ name: "home" });
    expect(parseRoute("/home/")).toEqual({ name: "home" });
  });

  it("解析课程与课时路径", () => {
    expect(parseRoute("/course")).toEqual({ name: "course" });
    expect(parseRoute("/lesson/day-3")).toEqual({ name: "lesson", lessonId: "day-3" });
  });

  it("解析其余模块路径", () => {
    expect(parseRoute("/practice")).toEqual({ name: "practice" });
    expect(parseRoute("/keyboard")).toEqual({ name: "keyboard" });
    expect(parseRoute("/stats")).toEqual({ name: "stats" });
    expect(parseRoute("/compare")).toEqual({ name: "compare" });
    expect(parseRoute("/settings")).toEqual({ name: "settings" });
  });

  it("未知路径进入 notFound 且保留原路径", () => {
    expect(parseRoute("/lesson/")).toEqual({ name: "notFound", path: "/lesson" });
    expect(parseRoute("/nope")).toEqual({ name: "notFound", path: "/nope" });
    expect(parseRoute("/lesson/day-1/extra")).toEqual({ name: "notFound", path: "/lesson/day-1/extra" });
  });
});

describe("路径生成", () => {
  it("每个路由都能往返一致", () => {
    const routes: Route[] = [
      { name: "home" },
      { name: "course" },
      { name: "lesson", lessonId: "day-7" },
      { name: "practice" },
      { name: "keyboard" },
      { name: "stats" },
      { name: "compare" },
      { name: "settings" },
    ];
    for (const route of routes) {
      expect(parseRoute(pathFor(route))).toEqual(route);
    }
  });

  it("导航项与解析结果一致", () => {
    for (const item of NAV_ITEMS) {
      expect(parseRoute(item.path).name).toBe(item.route);
    }
  });
});

describe("复习与专项路由", () => {
  it("解析复习页与键位专项", () => {
    expect(parseRoute("/review")).toEqual({ name: "review" });
    expect(parseRoute("/practice/key/v")).toEqual({ name: "practiceKey", key: "v" });
    expect(parseRoute("/practice/key/V")).toEqual({ name: "notFound", path: "/practice/key/V" });
  });

  it("专项路径可往返", () => {
    expect(pathFor({ name: "practiceKey", key: "q" })).toBe("/practice/key/q");
    expect(parseRoute(pathFor({ name: "practiceKey", key: "q" }))).toEqual({ name: "practiceKey", key: "q" });
    expect(parseRoute(pathFor({ name: "review" }))).toEqual({ name: "review" });
  });
});
