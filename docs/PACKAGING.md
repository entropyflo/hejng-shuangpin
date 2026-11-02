# 启动与离线使用

## 构建

```sh
npm install
npm run build
```

产物在 `apps/trainer/dist/`，其中 `sw.js` 由构建脚本按实际资源列表生成，并带有内容版本号。

## macOS 一键启动

双击 `release/start-macos.command`。首次可能需要在“系统设置 → 隐私与安全性”允许运行。
脚本会在本机 `127.0.0.1:4173` 启动静态服务并打开浏览器。

## Windows 一键启动

双击 `release/start-windows.bat`。需要已安装 Node.js 22+。

## 安装为 PWA

1. 用 Chrome/Edge 打开 `http://127.0.0.1:4173/`
2. 地址栏右侧点击“安装”，或菜单里选择“安装鹤径”
3. 安装后可从应用列表直接打开；断网仍可用（资源已预缓存）

## 数据与备份

- 学习记录保存在浏览器 IndexedDB
- 设置页可导出 JSON 备份（含校验和），导入前会校验并整体替换
- 清理浏览器站点数据会删除记录，请先导出备份

## 已知限制

- 仓库不包含签名的 `.app` / `.exe` 安装包；当前提供的是本地启动脚本 + PWA 安装
- Windows 启动脚本尚未在真机验证（当前只在 macOS 验证过启动与离线）
- 端口 4173 被占用时可改用：`node scripts/serve-dist.mjs 4174`
