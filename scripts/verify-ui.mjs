import assert from "node:assert/strict";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE_URL = (process.env.VERIFY_URL ?? "http://127.0.0.1:4174/").replace(/\/$/u, "");
const EVIDENCE_DIR = path.resolve("docs/evidence");

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

  // 首页
  await page.goto(`${BASE_URL}/home`, { waitUntil: "load" });
  assert.equal(await page.title(), "鹤径 · 小鹤双拼学习器");
  const stats = await page.locator(".stat-row").innerText();
  assert.match(stats, /7 天/u);
  assert.match(stats, /151 道/u);
  assert.match(stats, /100 个/u);
  assert.match(stats, /还没有记录/u);
  check("首页统计与冷启动状态", stats.replace(/\s+/gu, " "));

  // 从首页进入第 1 天并作答
  await page.getByRole("link", { name: /从第 1 天开始/u }).click();
  await page.waitForURL("**/lesson/day-1");
  assert.match(await page.locator(".exercise-card h3").first().innerText(), /韵母“a”/u);
  await page.locator(".answer-input").click();
  await page.keyboard.press("a");
  await page.getByRole("button", { name: "检查" }).click();
  await page.locator(".feedback-correct").waitFor();
  check("首页 → 课时 → 按键作答", "day-1 韵母 a 判定正确");

  // 浏览器后退恢复路由
  await page.goBack();
  await page.waitForURL("**/home");
  assert.match(await page.locator(".stat-row").innerText(), /第 1 天/u);
  check("浏览器后退与上次学习记录", "返回首页且显示“上次学习 第 1 天”");

  // 课程页
  await page.locator(".main-nav").getByRole("link", { name: "课程" }).click();
  await page.waitForURL("**/course");
  assert.equal(await page.locator(".lesson-list li").count(), 7);
  check("课程列表", "7 天全部列出");

  // 键位页
  await page.locator(".main-nav").getByRole("link", { name: "键位" }).click();
  await page.waitForURL("**/keyboard");
  assert.equal(await page.locator(".key").count(), 26);
  assert.equal(await page.locator(".data-table tbody tr").count(), 12);
  check("键位页", "26 键 + 12 个零声母");

  // 主题切换与持久化
  await page.locator(".main-nav").getByRole("link", { name: "设置" }).click();
  await page.waitForURL("**/settings");
  await page.getByRole("button", { name: "深色", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.reload({ waitUntil: "load" });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(await page.locator(".theme-select select").inputValue(), "dark");
  check("深色主题与刷新持久化", "data-theme=dark 且下拉保持深色");

  mkdirSync(EVIDENCE_DIR, { recursive: true });
  await page.goto(`${BASE_URL}/home`, { waitUntil: "load" });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "s2-home-dark.png"), fullPage: true });

  await page.goto(`${BASE_URL}/settings`, { waitUntil: "load" });
  await page.getByRole("button", { name: "浅色", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "light");
  await page.goto(`${BASE_URL}/home`, { waitUntil: "load" });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "s2-home-light.png"), fullPage: true });
  check("浅色主题与截图", "s2-home-light.png / s2-home-dark.png");

  // 自由训练
  await page.locator(".main-nav").getByRole("link", { name: "自由训练" }).click();
  await page.waitForURL("**/practice");
  const seedText = await page.locator(".filter-row").innerText();
  assert.match(seedText, /seed 1/u);
  assert.match(seedText, /共 20 题/u);
  await page.getByRole("button", { name: "换一批" }).click();
  assert.match(await page.locator(".filter-row").innerText(), /seed 2/u);
  await page.getByRole("button", { name: "挑战" }).click();
  assert.match(await page.locator(".filter-row").innerText(), /seed 1/u);
  check("自由训练抽题", "seed 可重现，换批与难度筛选生效");

  // 多音字修正持久化
  await page.goto(`${BASE_URL}/settings`, { waitUntil: "load" });
  await page.locator(".field input").fill("行");
  await page.locator(".badge-ambiguous").waitFor();
  await page.getByRole("button", { name: "hang" }).click();
  assert.match(await page.locator(".token-table").innerText(), /hh/u);
  await page.reload({ waitUntil: "load" });
  await page.locator(".field input").fill("行");
  await page.locator(".badge-confirmed").waitFor();
  assert.match(await page.locator(".token-table").innerText(), /hang/u);
  assert.match(await page.locator(".exercise-footer").innerText(), /已保存修正 1 条/u);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "s2-settings.png"), fullPage: true });
  await page.getByRole("button", { name: "清除全部修正" }).click();
  check("多音字修正刷新后仍生效", "行 → hang / hh，随后清除");

  // 未知路径
  await page.goto(`${BASE_URL}/nope`, { waitUntil: "load" });
  assert.match(await page.locator(".page-title").innerText(), /没有这个页面/u);
  await page.getByRole("link", { name: "回到首页" }).click();
  await page.waitForURL("**/home");
  check("404 页面", "未知路径给出提示并可返回首页");

  // 课时页截图
  await page.goto(`${BASE_URL}/lesson/day-6`, { waitUntil: "load" });
  await page.screenshot({ path: path.join(EVIDENCE_DIR, "s2-lesson.png"), fullPage: true });
  check("课时页截图", "s2-lesson.png");

  assert.deepEqual(consoleErrors, [], `浏览器控制台报错：${consoleErrors.join(" | ")}`);
  check("控制台无错误", "0 条 error/pageerror");

  console.log(`\n共 ${results.length} 项浏览器检查全部通过`);
} finally {
  await browser.close();
}
