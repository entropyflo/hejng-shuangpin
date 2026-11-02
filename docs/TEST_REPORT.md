# 阶段 S0 测试与人工验收报告

执行日期：2026-11-02（Asia/Shanghai）
OS：macOS / arm64
Git 基线：`e72fa38`
可运行工件：`apps/trainer/dist/`，本地预览 `http://127.0.0.1:4173/`

## 已执行

| 检查 | 命令/方法 | 结果 | 证据摘要 |
|---|---|---|---|
| 规格完整性 | `shasum -a 256 -c CHECKSUMS.sha256` | PASS | 13 个受校验文件全部 OK |
| 环境 | `codex/codebuddy/node/npm/git --version` | PASS | Codex 0.166.0；CodeBuddy 2.179.0；Node 22.22.3；npm 10.9.8；Git 2.54.0 |
| COORD-T01 Codex 冒烟 | 隔离临时 Git 仓库，`codex ... exec --ephemeral --json --sandbox read-only` | PASS | exit 0；事件含 `thread.started`、`turn.started`、`item.completed`、`turn.completed`；仅返回 `CODEX_S0_OK` |
| CodeBuddy CLI 基础调用 | `codebuddy -p --no-session-persistence --tools "" --output-format stream-json --max-turns 1` | PASS | exit 0；流式 JSON；未调用工具；本次 CLI 报告费用 0；结合用户接口身份确认作为 COORD-T02 证据 |
| COORD-T02 WorkBuddy International | CodeBuddy CLI 实际无工具调用 + 用户接口身份确认 | PASS | exit 0、流式 JSON、费用 0；用户于 2026-11-02 明确确认本项目中的 WorkBuddy International 即 CodeBuddy CLI |
| 类型检查 | `npm run typecheck` | PASS | exit 0 |
| 单元测试 | `npm test` | PASS | 1 文件、1 测试通过 |
| 生产构建 | `npm run build` | PASS | exit 0；Vite 17 modules；输出 HTML/CSS/JS、Manifest、SW、图标 |
| 依赖审计 | `npm audit --json` | PASS | 0 漏洞；此前插件链 10 个告警已通过移除该依赖清零 |
| 原型 HTTP | `curl --head /` 与读取 Manifest | PASS | 首页 HTTP 200；Manifest 内容可读 |
| 浏览器原型 | Codex in-app browser 打开本地预览 | PASS | 标题、主要入口与 7 天路径均可见；预览标签已保留 |

## 首次失败与修复

- `typecheck/build` 首轮因 Vite 配置类型不包含 Vitest `test` 字段而 FAIL；改用 `vitest/config` 后两项 PASS。
- 受限沙箱首次无法监听 `127.0.0.1:4173`；经用户批准后在最小本机 loopback 权限下启动并验证。
- `vite-plugin-pwa@2.0.0` 首次审计为 8 moderate / 2 low；改用自有最小 SW 后审计 PASS（0）。

## 尚未执行

- PWA-T01～T03：NOT_RUN（S0 只验证骨架构建与浏览器加载；不声称安装/断网/升级通过）。
- SCH/CUR/INP/UI/REV/STAT/DATA/PKG：NOT_RUN（对应阶段尚未开始）。
- Windows、真实 macOS/Windows IME：NOT_RUN。
- COORD-T03、T04 及完整故障注入：NOT_RUN（接口身份已确认，但真实自动接力尚未实现）。

## G0 人工验收

- 状态：`PASS`
- 用户确认：2026-11-02 明确“通过 G0”，并澄清 WorkBuddy International 即 CodeBuddy CLI，也允许调用桌面应用。
- 下一最小任务：SCH-001，小鹤官方键位核验与金样单测。
