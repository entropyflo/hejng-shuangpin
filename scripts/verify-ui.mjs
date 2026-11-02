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

  async function answerKey(key) {
    await page.locator(".answer-input").click();
    await page.keyboard.press(key);
    await page.getByRole("button", { name: "检查" }).click();
  }

  async function screenshot(name) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: path.join(EVIDENCE_DIR, name), fullPage: true });
  }

  async function goto(pathname) {
    await page.goto(`${BASE_URL}${pathname}`, { waitUntil: "load" });
  }

  // 首页
  await goto("/home");
  assert.equal(await page.title(), "鹤径 · 小鹤双拼学习器");
  const stats = await page.locator(".stat-row").innerText();
  assert.match(stats, /7 天/u);
  assert.match(stats, /151 道/u);
  assert.match(stats, /100 个/u);
  check("首页统计与冷启动", stats.replace(/\s+/gu, " "));

  // 首页 → 课时 → 作答
  await page.getByRole("link", { name: /从第 1 天开始/u }).click();
  await page.waitForURL("**/lesson/day-1");
  assert.match(await page.locator(".exercise-card h3").first().innerText(), /韵母“a”/u);

  // 键盘提示（自动模式，连对 0 题时显示）
  assert.equal(await page.locator(".hint-keyboard").count(), 1);
  assert.equal((await page.locator(".hint-key.is-next").innerText()).trim(), "A");
  check("屏幕键盘提示", "自动模式首题显示，高亮下一个键 A");

  await answerKey("a");
  await page.locator(".feedback-correct").waitFor();
  check("首页 → 课时 → 按键作答", "day-1 韵母 a 判定正确");

  // 浏览器后退
  await page.goBack();
  await page.waitForURL("**/home");
  assert.match(await page.locator(".stat-row").innerText(), /第 1 天/u);
  check("浏览器后退与上次学习记录", "返回首页且显示“上次学习 第 1 天”");

  // 课程与键位
  await page.locator(".main-nav").getByRole("link", { name: "课程" }).click();
  await page.waitForURL("**/course");
  assert.equal(await page.locator(".lesson-list li").count(), 7);
  await page.locator(".main-nav").getByRole("link", { name: "键位" }).click();
  await page.waitForURL("**/keyboard");
  assert.equal(await page.locator(".key").count(), 26);
  assert.equal(await page.locator(".data-table tbody tr").count(), 12);
  check("课程与键位页", "7 天课程；26 键 + 12 个零声母");

  // 主题
  await page.locator(".main-nav").getByRole("link", { name: "设置" }).click();
  await page.waitForURL("**/settings");
  await page.getByRole("button", { name: "深色", exact: true }).click();
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  await page.reload({ waitUntil: "load" });
  assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(await page.locator(".theme-select select").inputValue(), "dark");
  check("深色主题与刷新持久化", "data-theme=dark 且下拉保持深色");

  mkdirSync(EVIDENCE_DIR, { recursive: true });
  await goto("/home");
  await screenshot("s2-home-dark.png");
  await goto("/settings");
  await page.getByRole("button", { name: "浅色", exact: true }).click();
  await goto("/home");
  await screenshot("s2-home-light.png");
  check("浅色主题与截图", "s2-home-light.png / s2-home-dark.png");

  // 自由训练
  await page.locator(".main-nav").getByRole("link", { name: "自由训练" }).click();
  await page.waitForURL("**/practice");
  assert.match(await page.locator('[aria-label="难度筛选"]').innerText(), /seed 1/u);
  assert.match(await page.locator('[aria-label="难度筛选"]').innerText(), /共 20 题/u);
  await page.getByRole("button", { name: "换一批" }).click();
  assert.match(await page.locator('[aria-label="难度筛选"]').innerText(), /seed 2/u);
  await page.getByRole("button", { name: "挑战" }).click();
  assert.match(await page.locator('[aria-label="难度筛选"]').innerText(), /seed 1/u);
  check("自由训练抽题", "seed 可重现，换批与难度筛选生效");

  // 严格纠错：答错后必须按对才能继续
  await goto("/settings");
  await page.getByRole("button", { name: /^始终显示/u }).click();
  await page.getByRole("button", { name: /^严格/u }).click();
  await goto("/lesson/day-1");
  assert.equal(await page.locator(".hint-keyboard").count(), 1);
  await answerKey("x");
  await page.locator(".feedback-wrong").waitFor();
  assert.match(await page.locator(".feedback-wrong").innerText(), /严格纠错/u);
  assert.equal(await page.getByRole("button", { name: "下一题" }).isDisabled(), true);
  await page.locator(".hint-key.is-flash").waitFor({ timeout: 1200 });
  check("严格纠错锁定与正确键闪烁", "答错后下一题禁用，正确键闪烁");

  await answerKey("a");
  await page.locator(".feedback-correct").waitFor();
  assert.equal(await page.getByRole("button", { name: "下一题" }).isDisabled(), false);
  check("严格纠错答对后解锁", "按对 A 后下一题恢复可用");

  // 隐藏提示：答错仍短暂亮键
  await goto("/settings");
  await page.getByRole("button", { name: "隐藏", exact: true }).click();
  await goto("/lesson/day-1");
  assert.equal(await page.locator(".hint-keyboard").count(), 0);
  await answerKey("x");
  await page.locator(".hint-key.is-flash").waitFor({ timeout: 1200 });
  check("隐藏提示仍闪正确键", "初始无键盘，答错后短暂出现并高亮");

  // 自动提示：连对 3 题后隐藏
  await goto("/settings");
  await page.getByRole("button", { name: /^自动（连对/u }).click();
  await goto("/lesson/day-1");
  for (const key of ["a", "o", "e"]) {
    assert.equal(await page.locator(".hint-keyboard").count(), 1);
    await answerKey(key);
    await page.locator(".feedback-correct").waitFor();
    await page.getByRole("button", { name: "下一题" }).click();
  }
  assert.equal(await page.locator(".hint-keyboard").count(), 0);
  check("自动提示连对后隐藏", "连对 3 题后第 4 题不再显示键盘");

  // 连续纠错：答错不阻塞
  await goto("/settings");
  await page.getByRole("button", { name: /^连续/u }).click();
  await goto("/lesson/day-6");
  await answerKey("x");
  await page.locator(".feedback-wrong").waitFor();
  assert.equal(await page.getByRole("button", { name: "下一题" }).isDisabled(), false);
  check("连续纠错不阻塞", "词句题答错后仍可进入下一题");

  // 输入法模式：组合中不判定，提交后判定
  await goto("/settings");
  await page.getByRole("group", { name: "输入方式" }).getByRole("button", { name: "输入法模式" }).click();
  await goto("/lesson/day-6");
  assert.equal(await page.locator(".answer-input").count(), 0);
  assert.equal(await page.locator(".ime-input").count(), 1);

  await page.evaluate(() => {
    const element = document.querySelector(".ime-input");
    if (!(element instanceof HTMLTextAreaElement)) throw new Error("缺少输入法输入框");
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setValue?.call(element, "中");
    element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
    element.dispatchEvent(new InputEvent("input", { bubbles: true, data: "中", isComposing: true }));
  });
  await page.locator(".ime-status .badge-ambiguous").waitFor();
  assert.match(await page.locator(".ime-status").innerText(), /正在组合输入/u);
  check("输入法模式组合中不判定", "composition 中的候选不计分");

  await page.evaluate(() => {
    const element = document.querySelector(".ime-input");
    if (!(element instanceof HTMLTextAreaElement)) throw new Error("缺少输入法输入框");
    const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    setValue?.call(element, "中国");
    element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "中国" }));
    element.dispatchEvent(new InputEvent("input", { bubbles: true, data: "中国", isComposing: false }));
  });
  await page.locator(".feedback-correct").waitFor();
  const imeStatus = await page.locator(".ime-status").innerText();
  assert.match(imeStatus, /已提交 2 字/u);
  assert.match(imeStatus, /正确 2 字/u);
  check("输入法模式提交后判定", imeStatus.replace(/\s+/gu, " "));
  await screenshot("s2-ime.png");

  await page.reload({ waitUntil: "load" });
  assert.equal(await page.locator(".ime-input").count(), 1);
  check("输入法模式刷新后保持", "设置写入 localStorage");

  await page.getByRole("group", { name: "输入方式" }).getByRole("button", { name: "按键模式" }).click();
  assert.equal(await page.locator(".ime-input").count(), 0);

  // 速度挑战交互
  for (let step = 0; step < 20; step += 1) {
    const badge = await page.locator(".exercise-meta .badge").first().innerText();
    if (badge.includes("速度挑战")) break;
    await page.getByRole("button", { name: "下一题" }).click();
  }
  assert.match(await page.locator(".exercise-meta .badge").first().innerText(), /速度挑战/u);
  await page.getByRole("button", { name: "开始" }).click();
  await page.locator(".speed-input").fill("清风 明月");
  await page.waitForFunction(
    () => {
      const badge = document.querySelector(".speed-bar .badge");
      return badge ? /剩余\s*(59|58)\s*秒/u.test(badge.textContent ?? "") : false;
    },
    null,
    { timeout: 5000 },
  );
  await page.getByRole("button", { name: "提前结束" }).click();
  const speedResult = await page.locator(".speed-result").innerText();
  assert.match(speedResult, /用时/u);
  assert.match(speedResult, /正确字数/u);
  assert.doesNotMatch(speedResult, /用时\s*0\s*秒/u);
  check("速度挑战计时与结算", speedResult.replace(/\s+/gu, " "));

  await screenshot("s2-speed.png");

  // 课时页与提示截图
  await goto("/lesson/day-1");
  await screenshot("s2-lesson.png");
  check("课时页截图", "s2-lesson.png / s2-speed.png");

  // 多音字修正持久化
  await goto("/settings");
  await page.locator(".field input").fill("行");
  await page.locator(".badge-ambiguous").waitFor();
  await page.getByRole("button", { name: "hang" }).click();
  assert.match(await page.locator(".token-table").innerText(), /hh/u);
  await page.reload({ waitUntil: "load" });
  await page.locator(".field input").fill("行");
  await page.locator(".badge-confirmed").waitFor();
  assert.match(await page.locator(".token-table").innerText(), /hang/u);
  assert.match(await page.locator(".exercise-footer").innerText(), /已保存修正 1 条/u);
  await screenshot("s2-settings.png");
  await page.getByRole("button", { name: "清除全部修正" }).click();
  check("多音字修正刷新后仍生效", "行 → hang / hh，随后清除");

  // 专注、快捷键、指法与动画
  await goto("/settings");
  await page.getByRole("button", { name: /^指法提示：/u }).click();
  await page.getByRole("button", { name: /^动画：/u }).click();
  assert.equal(await page.locator("html").getAttribute("data-motion"), "off");
  await page.reload({ waitUntil: "load" });
  assert.equal(await page.locator("html").getAttribute("data-motion"), "off");
  await page.getByRole("button", { name: /^动画：/u }).click();
  assert.equal(await page.locator("html").getAttribute("data-motion"), "on");
  check("动画开关与持久化", "关闭后 data-motion=off，刷新仍保持，可重新开启");

  await goto("/lesson/day-1");
  assert.ok((await page.locator(".hint-key .finger").count()) > 0);
  await screenshot("s2-fingering.png");
  check("指法提示", "屏幕键盘显示推荐手指");

  await page.keyboard.press("f");
  assert.equal(await page.locator(".topbar").isVisible(), false);
  assert.equal(await page.locator(".focus-exit").isVisible(), true);
  await screenshot("s2-focus.png");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".topbar").isVisible(), true);
  check("专注模式快捷键", "F 进入、Esc 退出，顶栏隐藏后恢复");

  await page.keyboard.press("?");
  await page.locator(".dialog").waitFor();
  assert.match(await page.locator(".dialog").innerText(), /键盘快捷键/u);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator(".dialog").count(), 0);
  check("快捷键帮助", "? 打开、Esc 关闭");

  await page.keyboard.press("3");
  await page.waitForURL("**/lesson/day-3");
  check("数字快捷键跳转", "按 3 进入第 3 天");

  await page.locator(".answer-input").click();
  await page.keyboard.press("f");
  assert.equal(await page.locator(".topbar").isVisible(), true);
  check("输入框内不触发快捷键", "在作答框输入 f 不进入专注");

  // 404
  await goto("/nope");
  assert.match(await page.locator(".page-title").innerText(), /没有这个页面/u);
  await page.getByRole("link", { name: "回到首页" }).click();
  await page.waitForURL("**/home");
  check("404 页面", "未知路径给出提示并可返回首页");

  assert.deepEqual(consoleErrors, [], `浏览器控制台报错：${consoleErrors.join(" | ")}`);
  check("控制台无错误", "0 条 error/pageerror");

  console.log(`\n共 ${results.length} 项浏览器检查全部通过`);
} finally {
  await browser.close();
}
