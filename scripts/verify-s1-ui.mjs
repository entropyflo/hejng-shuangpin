import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE_URL = process.env.VERIFY_URL ?? "http://127.0.0.1:4174/";
const EVIDENCE_DIR = path.resolve("docs/evidence");
const SCREENSHOT = path.join(EVIDENCE_DIR, "s1-ui-verify.png");

function chromiumExecutable() {
  const cacheRoot = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  const candidates = readdirSync(cacheRoot)
    .filter((name) => name.startsWith("chromium-") && !name.includes("headless"))
    .sort()
    .reverse();
  for (const candidate of candidates) {
    const executable = path.join(
      cacheRoot,
      candidate,
      "chrome-mac-arm64",
      "Google Chrome for Testing.app",
      "Contents",
      "MacOS",
      "Google Chrome for Testing",
    );
    if (existsSync(executable)) return executable;
  }
  throw new Error("未找到缓存的 Chromium，可改用 PLAYWRIGHT_CHROMIUM_PATH 指定");
}

const results = [];
function check(name, detail) {
  results.push({ name, detail });
  console.log(`PASS ${name}${detail ? ` — ${detail}` : ""}`);
}

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? chromiumExecutable(),
  headless: true,
});

try {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  await page.goto(BASE_URL, { waitUntil: "load" });
  assert.equal(await page.title(), "鹤径 · 小鹤双拼学习器");
  check("页面标题", await page.title());

  const stats = await page.locator(".stat-row").innerText();
  assert.match(stats, /7 天/u);
  assert.match(stats, /151 道/u);
  assert.match(stats, /100 个/u);
  check("统计数字", stats.replace(/\s+/gu, " "));

  // 课程练习：正确作答
  const firstPrompt = await page.locator(".exercise-card h3").first().innerText();
  assert.match(firstPrompt, /韵母“a”/u);
  await page.locator(".answer-input").click();
  await page.keyboard.press("a");
  await page.getByRole("button", { name: "检查" }).click();
  await page.locator(".feedback-correct").waitFor();
  const correctText = await page.locator(".feedback-correct").innerText();
  assert.match(correctText, /正确/u);
  check("按键模式正确作答", correctText.split("\n")[0]);

  // 课程练习：错误作答与显示答案
  await page.getByRole("button", { name: "下一题" }).click();
  await page.locator(".answer-input").click();
  await page.keyboard.press("x");
  await page.getByRole("button", { name: "检查" }).click();
  await page.locator(".feedback-wrong").waitFor();
  assert.match(await page.locator(".feedback-wrong").innerText(), /还不对/u);
  await page.getByRole("button", { name: "显示答案" }).click();
  const revealed = await page.locator(".feedback-revealed").innerText();
  assert.match(revealed, /正确码为/u);
  check("错误反馈与答案揭示", revealed.replace(/\s+/gu, " ").slice(0, 60));

  // 键位映射图
  await page.getByRole("tab", { name: "键位映射" }).click();
  const keyCount = await page.locator(".key").count();
  assert.equal(keyCount, 26);
  const vKey = await page.locator(".key").filter({ has: page.locator(".key-cap", { hasText: /^V$/u }) }).innerText();
  assert.match(vKey, /zh/u);
  assert.match(vKey, /ui/u);
  const zeroRows = await page.locator(".data-table tbody tr").count();
  assert.equal(zeroRows, 12);
  check("键位映射图", `${keyCount} 键；V 键含 zh/ui；零声母 ${zeroRows} 行`);

  // 多音字修正与持久化
  await page.getByRole("tab", { name: "多音字修正" }).click();
  await page.locator(".field input").fill("行");
  const ambiguousBadge = page.locator(".badge-ambiguous");
  await ambiguousBadge.waitFor();
  await page.getByRole("button", { name: "hang" }).click();
  const tokenTable = page.locator(".token-table");
  assert.match(await tokenTable.innerText(), /hang/u);
  assert.match(await tokenTable.innerText(), /hh/u);
  assert.match(await page.locator(".exercise-footer").innerText(), /已保存修正 1 条/u);
  check("歧义字改读音并保存", "行 → hang，编码 hh");

  await page.reload({ waitUntil: "load" });
  await page.getByRole("tab", { name: "多音字修正" }).click();
  await page.locator(".field input").fill("行");
  await page.locator(".badge-confirmed").waitFor();
  const persisted = await page.locator(".token-table").innerText();
  assert.match(persisted, /hang/u);
  assert.match(persisted, /hh/u);
  assert.match(await page.locator(".exercise-footer").innerText(), /已保存修正 1 条/u);
  check("刷新后 localStorage 修正仍生效", "重新加载后仍为 hang / hh");

  await page.getByRole("button", { name: "清除全部修正" }).click();
  assert.match(await page.locator(".exercise-footer").innerText(), /已保存修正 0 条/u);
  check("清除修正", "回到 0 条");

  // 回到课程并截图
  await page.getByRole("tab", { name: "七天课程" }).click();
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.screenshot({ path: SCREENSHOT, fullPage: true });
  check("截图", SCREENSHOT);

  await page.getByRole("tab", { name: "键位映射" }).click();
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "s1-keyboard-verify.png"), fullPage: true });
  await page.getByRole("tab", { name: "多音字修正" }).click();
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "s1-readings-verify.png"), fullPage: true });
  check("截图", "键位映射与多音字修正页");

  assert.deepEqual(consoleErrors, [], `浏览器控制台报错：${consoleErrors.join(" | ")}`);
  check("控制台无错误", "0 条 error/pageerror");

  console.log(`\n共 ${results.length} 项浏览器检查全部通过`);
} finally {
  await browser.close();
}
