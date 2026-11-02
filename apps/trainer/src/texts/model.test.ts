import { describe, expect, it } from "vitest";
import { MAX_CONTENT_LENGTH, previewOf, validateCustomText } from "./model.js";

describe("自定义文本校验", () => {
  it("拒绝空名称", () => {
    expect(validateCustomText("  ", "你好")).toMatchObject({ ok: false });
  });

  it("拒绝过短正文", () => {
    expect(validateCustomText("名字", "你")).toMatchObject({ ok: false });
  });

  it("过滤拉丁字母与换行并保留标点", () => {
    const result = validateCustomText("  每日一句  ", "你好 abc，\n今天练习双拼。");
    expect(result).toEqual({ ok: true, name: "每日一句", content: "你好 ，今天练习双拼。" });
  });

  it("按上限截断正文", () => {
    const result = validateCustomText("长文", "字".repeat(MAX_CONTENT_LENGTH + 20));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.content.length).toBe(MAX_CONTENT_LENGTH);
  });

  it("预览按长度截断", () => {
    expect(previewOf("一二三四五", 3)).toBe("一二三…");
    expect(previewOf("一二三", 3)).toBe("一二三");
  });
});
