import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE_URL = (process.env.SHOWCASE_URL ?? "http://127.0.0.1:4174").replace(/\/$/u, "");
const OUTPUT_DIR = path.resolve("docs/showcase");
const FRAME_DIR = mkdtempSync(path.join(os.tmpdir(), "hejng-showcase-"));

function chromiumExecutable() {
  const cacheRoot = path.join(os.homedir(), "Library", "Caches", "ms-playwright");
  for (const candidate of readdirSync(cacheRoot).filter((name) => name.startsWith("chromium-")).sort().reverse()) {
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
  throw new Error("未找到 Playwright Chromium");
}

mkdirSync(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch({ executablePath: chromiumExecutable(), headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
});
const page = await context.newPage();
let frame = 0;

async function capture(repeat = 1) {
  for (let index = 0; index < repeat; index += 1) {
    frame += 1;
    await page.screenshot({ path: path.join(FRAME_DIR, `frame-${String(frame).padStart(4, "0")}.png`) });
  }
}

await page.goto(`${BASE_URL}/home`, { waitUntil: "networkidle" });
await capture(14);
for (const top of [100, 220, 360, 500, 620]) {
  await page.evaluate((nextTop) => window.scrollTo(0, nextTop), top);
  await capture(2);
}
await capture(10);
await page.evaluate(() => window.scrollTo(0, 0));
await capture(6);

await page.getByRole("link", { name: "练习", exact: true }).click();
await capture(10);
await page.getByRole("link", { name: "自定义文本" }).click();
await capture(8);
await page.getByRole("button", { name: "新建文本" }).click();
await page.locator("textarea.ime-input").fill("今天练习双拼。");
await capture(7);
await page.getByRole("button", { name: "保存" }).click();
await capture(5);
await page.getByRole("button", { name: "练习" }).click();
await capture(12);

const input = page.getByRole("textbox", { name: "双拼逐字输入" });
for (const key of "jbxx") {
  await input.press(key);
  await capture(3);
}
await capture(8);
await input.press("Backspace");
await input.press("Backspace");
await input.press("Backspace");
for (const key of "tmlmxiulpb") {
  await input.press(key);
  await capture(3);
}
await capture(18);

await context.close();
await browser.close();

const ffmpeg = process.env.FFMPEG_PATH ?? "/opt/homebrew/bin/ffmpeg";
const inputPattern = path.join(FRAME_DIR, "frame-%04d.png");
execFileSync(ffmpeg, [
  "-y", "-loglevel", "error", "-framerate", "10", "-i", inputPattern,
  "-c:v", "libx264", "-crf", "24", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  path.join(OUTPUT_DIR, "hejng-demo.mp4"),
]);
execFileSync(ffmpeg, [
  "-y", "-loglevel", "error", "-framerate", "10", "-i", inputPattern,
  "-vf", "fps=10,scale=960:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128[p];[s1][p]paletteuse=dither=bayer",
  "-loop", "0", path.join(OUTPUT_DIR, "hejng-demo.gif"),
]);
rmSync(FRAME_DIR, { recursive: true, force: true });

console.log("已生成 docs/showcase/hejng-demo.gif 与 hejng-demo.mp4");
