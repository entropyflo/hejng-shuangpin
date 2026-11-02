import { describe, expect, it } from "vitest";
import { deriveTextName, MAX_CONTENT_LENGTH, previewOf, validateCustomText } from "./model.js";

describe("自定义文本校验", () => {
  it("拒绝过短正文", () => {
    expect(validateCustomText("你")).toMatchObject({ ok: false });
  });

  it("过滤拉丁字母与换行、保留标点并自动取名", () => {
    const result = validateCustomText("你好 abc，\n今天练习双拼。");
    expect(result).toEqual({ ok: true, name: "你好今天练习双拼", content: "你好 ，今天练习双拼。" });
  });

  it("按上限截断正文", () => {
    const result = validateCustomText("字".repeat(MAX_CONTENT_LENGTH + 20));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.content.length).toBe(MAX_CONTENT_LENGTH);
  });

  it("名称从正文自动生成并限制长度", () => {
    expect(deriveTextName("今天，开始练习双拼。保持节奏继续前进！")).toBe("今天开始练习双拼保持节奏继续");
  });

  it("预览按长度截断", () => {
    expect(previewOf("一二三四五", 3)).toBe("一二三…");
    expect(previewOf("一二三", 3)).toBe("一二三");
  });
});
