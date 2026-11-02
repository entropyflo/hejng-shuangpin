import { sanitizePracticeText } from "../curriculum/content";

export const MAX_CONTENT_LENGTH = 500;
export const AUTO_NAME_LENGTH = 14;

export type CustomTextValidation =
  | { ok: true; name: string; content: string }
  | { ok: false; error: string };

export function validateCustomText(rawContent: string): CustomTextValidation {
  const content = sanitizePracticeText(rawContent, MAX_CONTENT_LENGTH);
  if (content.trim().length < 2) {
    return { ok: false, error: "正文至少需要 2 个汉字。" };
  }

  return { ok: true, name: deriveTextName(content), content };
}

export function deriveTextName(content: string): string {
  const compact = content.replace(/[，。！？；：、“”‘’（）《》\s]/gu, "");
  const title = Array.from(compact).slice(0, AUTO_NAME_LENGTH).join("");
  return title || "自定义文本";
}

export function previewOf(content: string, length = 40): string {
  return content.length > length ? `${content.slice(0, length)}…` : content;
}
