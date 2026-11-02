import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, readdirSync } from "node:fs";
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

  async function waitForFocus() {
    await page.waitForFunction(
      () => document.activeElement?.classList.contains("answer-input") ?? false,
      null,
      { timeout: 5000 },
    );
  }

  async function answerKey(key) {
    await waitForFocus();
    await page.keyboard.press(key);
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
  assert.match(stats, /学习天数/u);
  assert.match(stats, /XP/u);
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  assert.equal(background, "rgb(255, 255, 255)");
  const boxes = await page.locator(".course-grid li").evaluateAll((items) =>
    items.slice(0, 2).map((element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y };
    }),
  );
  assert.ok(Math.abs(boxes[0].x - boxes[1].x) < 2);
  assert.ok(boxes[1].y > boxes[0].y);
  check("白色背景与竖列路径", "body 背景 #fff，七天路径纵向排列");

  // 首页 → 课时 → 作答
  await page.getByRole("link", { name: /从第 1 天开始/u }).click();
  await page.waitForURL("**/lesson/day-1");
  assert.match(await page.locator(".exercise-card h3").first().innerText(), /韵母“a”/u);

  // 键位图（自动模式，连对 0 题时显示下一个键提示）
  assert.equal(await page.locator(".mapping-keyboard").count(), 1);
  assert.equal((await page.locator(".mk-key.is-next").innerText()).trim().split("\n")[0], "A");
  check("键位图与下一个键提示", "自动模式首题高亮下一个键 A");

  assert.equal(await page.getByText("本课结构").count(), 0);
  await waitForFocus();
  check("作答框自动聚焦", "进入课时无需点击输入框");

  await page.keyboard.type("a");
  await page.locator(".feedback-correct").waitFor();
  assert.equal(await page.getByRole("button", { name: "检查" }).count(), 0);
  const pressed = page.locator(".mk-key.is-correct");
  assert.equal((await pressed.innerText()).includes("A"), true);
  assert.equal((await pressed.innerText()).split("\n").filter(Boolean).length, 3);
  check("按下即判定与键位着色", "按 A 后立即判定，键位绿色显示声母/韵母");

  await page.keyboard.press("Space");
  await page.waitForFunction(() => document.querySelector(".exercise-card h3")?.textContent?.includes("韵母“o”"));
  assert.equal(
    await page.evaluate(() => document.activeElement?.classList.contains("answer-input") ?? false),
    true,
  );
  check("空格切题", "切题后输入框仍聚焦");

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
  assert.equal(await page.locator(".mapping-keyboard").count(), 1);
  await answerKey("x");
  await page.locator(".feedback-wrong").waitFor();
  assert.match(await page.locator(".feedback-wrong").innerText(), /严格纠错/u);
  assert.equal(await page.getByRole("button", { name: "下一题" }).isDisabled(), true);
  assert.equal((await page.locator(".mk-key.is-wrong").innerText()).includes("X"), true);
  check("严格纠错与错误键标红", "答错后下一题禁用，X 键红色");

  await answerKey("a");
  await page.locator(".feedback-correct").waitFor();
  assert.equal(await page.getByRole("button", { name: "下一题" }).isDisabled(), false);
  check("严格纠错答对后解锁", "按对 A 后下一题恢复可用");

  // 隐藏提示：答错仍短暂亮键
  await goto("/settings");
  await page.getByRole("button", { name: "隐藏", exact: true }).click();
  await goto("/lesson/day-1");
  assert.equal(await page.locator(".mk-key.is-next").count(), 0);
  await answerKey("x");
  await page.locator(".feedback-wrong").waitFor();
  assert.equal((await page.locator(".mk-key.is-wrong").innerText()).includes("X"), true);
  check("隐藏提示不显示下一键", "不提示下一个键，答错键仍标红");

  // 自动提示：连对 3 题后隐藏
  await goto("/settings");
  await page.getByRole("button", { name: /^自动（连对/u }).click();
  await goto("/lesson/day-1");
  for (const key of ["a", "o", "e"]) {
    assert.equal(await page.locator(".mk-key.is-next").count(), 1);
    await answerKey(key);
    await page.locator(".feedback-correct").waitFor();
    await page.getByRole("button", { name: "下一题" }).click();
  }
  assert.equal(await page.locator(".mk-key.is-next").count(), 0);
  assert.equal(await page.locator(".mapping-keyboard").count(), 1);
  check("自动提示连对后隐藏", "连对 3 题后不再高亮下一个键，键位图仍在");

  // 连续纠错：答错不阻塞
  await goto("/settings");
  await page.getByRole("button", { name: /^连续/u }).click();
  await goto("/lesson/day-6");
  await waitForFocus();
  await page.keyboard.type("xxxx");
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
  await page.getByRole("button", { name: /^动画：/u }).click();
  assert.equal(await page.locator("html").getAttribute("data-motion"), "off");
  await page.reload({ waitUntil: "load" });
  assert.equal(await page.locator("html").getAttribute("data-motion"), "off");
  await page.getByRole("button", { name: /^动画：/u }).click();
  assert.equal(await page.locator("html").getAttribute("data-motion"), "on");
  check("动画开关与持久化", "关闭后 data-motion=off，刷新仍保持，可重新开启");

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

  // 完成一轮课程，验证会话结算与真实统计
  await goto("/lesson/day-1");
  for (const key of ["a", "o", "e", "i", "u", "v"]) {
    await answerKey(key);
    await page.locator(".feedback-correct").waitFor();
    await page.getByRole("button", { name: "下一题" }).click();
  }
  await page.locator(".option").filter({ hasText: /^a$/u }).click();
  await page.locator(".feedback-correct").waitFor();
  await page.getByRole("button", { name: "下一题" }).click();
  await page.locator(".summary-grid").waitFor();
  const summary = await page.locator(".summary-grid").innerText();
  assert.match(summary, /100%/u);
  assert.match(summary, /★★★/u);
  check("完成一轮并结算", summary.replace(/\s+/gu, " "));

  await page.getByRole("link", { name: "查看统计" }).click();
  await page.waitForURL("**/stats");
  await page.locator(".data-table").last().waitFor();
  const history = await page.locator(".data-table").last().innerText();
  assert.match(history, /课程 day-1/u);
  assert.match(history, /100%/u);
  check("统计页读取真实记录", history.split("\n").slice(0, 2).join(" "));

  await page.reload({ waitUntil: "load" });
  await page.locator(".data-table").last().waitFor();
  assert.match(await page.locator(".data-table").last().innerText(), /课程 day-1/u);
  check("IndexedDB 刷新后仍保留", "重新加载统计页仍有记录");
  await screenshot("s2-stats.png");

  // 热力图与错题本
  await goto("/stats");
  assert.equal(await page.locator(".heat-key").count(), 26);
  assert.ok((await page.locator(".heat-key.is-weak").count()) > 0);
  const mistakesText = await page.locator('[aria-labelledby="mistakes-title"] .data-table').innerText();
  assert.match(mistakesText, /韵母“a”/u);
  await screenshot("s3-heatmap.png");
  check("键位热力图与错题本", "26 键有正确率着色，错题本列出最常错的题");

  await page.locator(".heat-key").first().click();
  await page.waitForURL(/\/practice\/key\/[a-z]/u);
  assert.match(await page.locator(".page-title").innerText(), /键专项/u);
  check("热力图跳转键位专项", await page.locator(".page-title").innerText());

  // 注入到期记录，验证复习队列与首页计划
  await page.evaluate(async () => {
    const request = indexedDB.open("xiaohe-trainer");
    const db = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction("mastery", "readwrite");
    tx.objectStore("mastery").put({
      knowledgeId: "final.ang",
      attempts: 1,
      correctAttempts: 0,
      streak: 0,
      ease: 2,
      intervalDays: 0,
      lastPracticedAt: Date.now() - 1000,
      nextDueAt: Date.now() - 1000,
      lastResponseMs: 3000,
    });
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
    db.close();
  });

  await goto("/review");
  await page.locator(".exercise-card").waitFor();
  assert.match(await page.locator("#review-title").innerText(), /1 题/u);
  await screenshot("s3-review.png");
  check("到期复习队列", await page.locator("#review-title").innerText());

  await goto("/home");
  assert.match(await page.locator(".plan-grid").innerText(), /复习 1 个到期知识点/u);
  check("首页今日计划含到期复习", "计划优先显示复习卡片");

  // 全拼 / 小鹤对比
  await goto("/compare");
  await page.getByRole("button", { name: "开始" }).click();
  await page.locator(".speed-input").fill("清风明月");
  await page.waitForFunction(
    () => /剩余\s*(29|28)\s*秒/u.test(document.querySelector(".speed-bar .badge")?.textContent ?? ""),
    null,
    { timeout: 5000 },
  );
  await page.getByRole("button", { name: "提前结束" }).click();
  await page.getByRole("heading", { name: "全拼测速" }).waitFor();
  await page.getByRole("button", { name: "开始" }).click();
  await page.locator(".speed-input").fill("清风明月");
  await page.waitForFunction(
    () => /剩余\s*(29|28)\s*秒/u.test(document.querySelector(".speed-bar .badge")?.textContent ?? ""),
    null,
    { timeout: 5000 },
  );
  await page.getByRole("button", { name: "提前结束" }).click();
  await page.locator(".summary-grid").waitFor();
  const compareResult = await page.locator(".summary-grid").innerText();
  assert.match(compareResult, /小鹤 CPM/u);
  assert.match(compareResult, /提升/u);
  await page.locator('[aria-labelledby="compare-history-title"] .data-table').waitFor();
  assert.match(await page.locator('[aria-labelledby="compare-history-title"] .data-table').innerText(), /清风明月/u);
  check("全拼/小鹤对比与保存", compareResult.replace(/\s+/gu, " "));
  await screenshot("s3-compare.png");

  await page.reload({ waitUntil: "load" });
  await page.locator('[aria-labelledby="compare-history-title"] .data-table').waitFor();
  assert.match(await page.locator('[aria-labelledby="compare-history-title"] .data-table').innerText(), /清风明月/u);
  check("对比历史刷新后保留", "IndexedDB comparisons 表");

  await goto("/stats");
  await page.locator(".spark").first().waitFor();
  assert.ok((await page.locator(".spark").count()) >= 1);
  assert.match(await page.locator('[aria-labelledby="trend-title"]').innerText(), /正确率/u);
  await screenshot("s3-trend.png");
  check("趋势图", "正确率折线渲染");

  // 关卡状态、学习天数与 XP
  await goto("/course");
  const firstLesson = await page.locator(".lesson-list li").first().innerText();
  assert.match(firstLesson, /已完成/u);
  assert.match(firstLesson, /★★★/u);
  await goto("/home");
  assert.match(await page.locator(".stat-row").innerText(), /学习天数/u);
  check("关卡状态与学习天数", firstLesson.replace(/\s+/gu, " ").slice(0, 60));

  // 答错当轮插回
  await goto("/lesson/day-2");
  await answerKey("x");
  const queueMeta = await page.locator(".exercise-meta .muted").innerText();
  assert.match(queueMeta, /\/ 11/u);
  check("答错当轮插回", queueMeta);

  // 自定义文本
  await goto("/texts");
  await page.getByRole("button", { name: "新建文本" }).click();
  await page.locator(".field input").fill("每日一句");
  await page.locator("textarea.ime-input").fill("今天练习双拼。");
  await page.getByRole("button", { name: "保存" }).click();
  await page.locator("table.data-table").waitFor();
  assert.match(await page.locator("table.data-table").innerText(), /每日一句/u);
  await page.getByRole("button", { name: "练习" }).click();
  await page.locator("section[aria-labelledby=\"practice-title\"] .ime-input").fill("今天练习双拼。");
  await page.locator("section[aria-labelledby=\"practice-title\"] .feedback-correct").first().waitFor();
  await goto("/texts");
  assert.match(await page.locator("table.data-table").innerText(), /每日一句/u);
  check("自定义文本保存与练习", "保存后刷新仍在，练习完成");

  // 混合训练加权
  await goto("/mixed");
  await page.locator(".exercise-card").waitFor();
  assert.match(await page.locator(".filter-row").innerText(), /薄弱加权/u);
  assert.match(await page.locator(".filter-row").innerText(), /共 20 题/u);
  await page.getByRole("button", { name: "完全随机" }).click();
  assert.match(await page.locator(".filter-row").innerText(), /共 20 题/u);
  check("混合训练加权抽题", "薄弱加权/随机切换，20 题");

  // 备份导出 / 清空 / 导入恢复
  await goto("/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "导出备份" }).click();
  const download = await downloadPromise;
  const backupPath = path.join(os.tmpdir(), `xiaohe-backup-${Date.now()}.json`);
  await download.saveAs(backupPath);
  const backup = JSON.parse(readFileSync(backupPath, "utf8"));
  assert.equal(backup.schemaVersion, 3);
  assert.ok(backup.counts.sessions >= 1);
  assert.ok(backup.counts.texts >= 1);
  assert.match(backup.checksum, /^[0-9a-f]{8}$/u);
  check("导出备份", `${backup.counts.attempts} 条作答 / ${backup.counts.sessions} 次会话`);

  await page.getByRole("button", { name: "清空全部数据" }).click();
  await page.getByRole("button", { name: "确认清空" }).click();
  await page.locator(".muted.small").filter({ hasText: "已清空" }).waitFor();
  await goto("/stats");
  assert.match(await page.locator(".panel").first().innerText(), /还没有数据/u);
  check("清空本机数据", "统计页回到空状态");

  await goto("/settings");
  page.once("dialog", (dialog) => dialog.accept());
  await page.locator('input[type="file"]').setInputFiles(backupPath);
  await page.locator(".muted.small").filter({ hasText: "导入完成" }).waitFor();
  await goto("/stats");
  assert.match(await page.locator('[aria-labelledby="history-title"] .data-table').innerText(), /课程 day-1/u);
  check("导入备份恢复数据", "清空后导入，会话记录恢复");

  // 离线：Service Worker 预缓存
  await goto("/home");
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), null, { timeout: 20000 });
  assert.equal(await page.locator(".update-banner").count(), 0);
  await context.setOffline(true);
  await page.reload({ waitUntil: "load" });
  assert.equal(await page.title(), "鹤径 · 小鹤双拼学习器");
  assert.equal(await page.locator(".main-nav").isVisible(), true);
  await goto("/lesson/day-1");
  assert.match(await page.locator(".exercise-card h3").innerText(), /韵母“a”/u);
  await context.setOffline(false);
  check("断网刷新与路由", "离线仍可打开首页与课时页");

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
