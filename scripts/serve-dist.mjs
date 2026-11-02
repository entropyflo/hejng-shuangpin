import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..", "apps", "trainer", "dist");
const port = Number(process.env.PORT ?? process.argv[2] ?? 4173);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

if (!existsSync(join(root, "index.html"))) {
  console.error("未找到构建产物，请先运行 npm run build。");
  process.exit(1);
}

const server = createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  let filePath = join(root, decodeURIComponent(url.pathname));

  if (!filePath.startsWith(root)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, "index.html");
  }

  const extension = extname(filePath);
  const isServiceWorker = filePath.endsWith("sw.js");
  const isHtml = extension === ".html";

  response.writeHead(200, {
    "content-type": MIME[extension] ?? "application/octet-stream",
    "cache-control": isHtml || isServiceWorker ? "no-cache" : "public, max-age=31536000, immutable",
  });
  createReadStream(filePath).pipe(response);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`鹤径已启动：http://127.0.0.1:${port}/`);
  console.log("按 Ctrl+C 停止。");
});
