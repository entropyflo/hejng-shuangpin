import { sanitizePracticeText } from "../curriculum/content";

export const MAX_NAME_LENGTH = 40;
export const MAX_CONTENT_LENGTH = 500;

export type CustomTextValidation =
  | { ok: true; name: string; content: string }
  | { ok: false; error: string };

export function validateCustomText(name: string, rawContent: string): CustomTextValidation {
  const trimmed = name.trim();
  if (trimmed.length === 0) return { ok: false, error: "请填写名称。" };
  if (trimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, error: `名称最多 ${MAX_NAME_LENGTH} 个字。` };
  }

  const content = sanitizePracticeText(rawContent, MAX_CONTENT_LENGTH);
  if (content.trim().length < 2) {
    return { ok: false, error: "正文至少需要 2 个汉字。" };
  }

  return { ok: true, name: trimmed, content };
}

export function previewOf(content: string, length = 40): string {
  return content.length > length ? `${content.slice(0, length)}…` : content;
}
