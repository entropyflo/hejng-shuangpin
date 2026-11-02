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

## S1 / SCH-001 增量

执行日期：2026-11-02（Asia/Shanghai）

| 测试 | 结果 | 证据 |
|---|---|---|
| SCH-T01 声母与完整韵母键位 | PASS | `flypy.test.ts` 锁定普通声母、`zh/ch/sh` 和完整韵母表；与小鹤官网、Apple 布局、Rime 规则和文本键位表交叉 |
| SCH-T03 公开样例 | PASS | `shuang→ul`、`pin→pb`、`zhong→vs`、`wen→wf` |
| 未知规则安全失败 | PASS | 零声母在 SCH-002 前抛 `ZERO_INITIAL_NOT_IMPLEMENTED`；未知声母/韵母抛有类型错误 |
| 自动化回归 | PASS | `npm run typecheck` exit 0；`npm test` 2 文件/12 测试 PASS；`npm run build` exit 0 |

SCH-001 不包含零声母与完整拼音正规化；这些项目保持 `NOT_RUN` 并进入 SCH-002。

## S1 / SCH-002 增量

执行日期：2026-11-02（Asia/Shanghai）

| 测试 | 结果 | 证据 |
|---|---|---|
| SCH-T02 十二个零声母 | PASS | `a/o/e` 重复、七个双字母保持全拼、`ang→ah`、`eng→eg`；带调样例覆盖 |
| `ü/v/u:` 正规化 | PASS | `nǚ→nv`、`lve→lt`，声调符号和尾部声调数字被规范移除 |
| `j/q/x/y` 拼写规则 | PASS | `ju→jv`、`que→qt`、`xuan→xr`、`yun→yy`，内部显式保留 `ü` |
| 完整韵母拼写 | PASS | `iou/uei/uen→iu/ui/un` |
| 非法零声母 | PASS | 非十二项输入抛 `UNSUPPORTED_ZERO_INITIAL` |
| 自动化回归 | PASS | `npm test` 2 文件/42 测试 PASS；此前同一变更的 typecheck/build 均 exit 0 |

## S1 / SCH-003 增量

执行日期：2026-11-02（Asia/Shanghai）

| 测试 | 结果 | 证据 |
|---|---|---|
| SCH-T04 上下文多音词 | PASS | `银行/行走/重庆/重要/音乐` 词级读音与双拼码全部通过 |
| 单字歧义 | PASS | `行/重/乐` 保留候选、不自动选定；未知字不猜测 |
| 位置级人工修正 | PASS | 修正优先于词典，绑定 `textId + textVersion + span`，重复生成一致 |
| 修正导出导入 | PASS | schemaVersion 1 往返一致，错误版本被拒绝 |
| 仓储重新实例化 | SIMULATED_ONLY | 内存 Storage 适配器模拟重新打开后可恢复；真实浏览器 localStorage 尚未接 UI |
| 首轮自动化 | FAIL | 3 个断言把“属性不存在”误写为“属性值 undefined”；领域结果正确，测试已修正 |
| 修复后回归 | PASS | `npm run typecheck` exit 0；`npm test` 3 文件/58 测试 PASS；`npm run build` exit 0 |

## S1 / CUR-001～CUR-002 增量

执行日期：2026-11-02（Asia/Shanghai）
Git 基线：`7d1aa98`（本次提交前）

| 测试 | 结果 | 证据 |
|---|---|---|
| CUR-T01 七天课程结构 | PASS | 7 天全部 `locked: false`；每天固定“导学/演示/实操/小测/混合”五步；七天合计覆盖五种题型 |
| CUR-T02 分层原创题库 | PASS | 单字 12、双字词 8、多字词 5、短句 4、段落 1、速度 3；每题含读音、双拼码、解释、错误提示与知识点 |
| CUR-T02b 键位与零声母覆盖 | PASS | 23 个声母、34 个展示韵母、12 个零声母均有例题；26 个字母键全部出现 |
| CUR-T03 一致性筛查 | PASS | `inspectCurriculum` 对正常题库返回空数组；注入重复 ID、错码、缺题、读音数量不符、未知读音、未知知识点、重复文本、非法字符、未覆盖知识点共 9 类坏题均被识别 |
| CUR-T04 题库 JSON Schema | PASS | `z.toJSONSchema` 导出 draft-2020-12，含 `contentVersion`/`text-typing`，可 JSON 序列化 |
| CUR-T05 全量回归 | PASS | `npm run typecheck` exit 0；`npm test` 4 文件/75 测试 PASS；`npm run build` exit 0 |

说明：本轮仅做领域层与内容校验，未接入真实浏览器 IME，因此不声称任何输入法或 UI 验收通过。JSON Schema 为构建期生成并随代码导出，未引入 `ajv` 等运行时校验依赖。

## S1 / G1 准备：验证页真实浏览器检查

执行日期：2026-11-02（Asia/Shanghai）
被测工件：`npm run build` 产物，经 `vite preview` 在 `http://127.0.0.1:4174/` 提供
浏览器：Playwright 驱动本机缓存 Chromium（Chrome for Testing 151.0.7922.34，headless）
命令：`node scripts/verify-s1-ui.mjs`（可用 `VERIFY_URL` 覆盖地址，`PLAYWRIGHT_CHROMIUM_PATH` 覆盖浏览器路径）

| 检查 | 结果 | 证据 |
|---|---|---|
| 页面标题与首屏 | PASS | 标题为“鹤径 · 小鹤双拼学习器”；统计显示 7 天 / 151 道 / 100 个知识点 |
| 按键模式正确作答 | PASS | 第 1 天第 1 题“韵母 a”按物理键 <kbd>A</kbd> 后显示“正确” |
| 错误反馈与答案揭示 | PASS | 输入错误显示“还不对”，点击“显示答案”给出正确码 `o` 与规则解释 |
| 键位映射图 | PASS | 26 个字母键全部渲染；V 键同时显示 `zh` 与 `ui`；零声母表 12 行 |
| 歧义字改读音 | PASS | 文本“行”显示“有歧义”，选择 `hang` 后读音为 hang、编码 `hh` |
| localStorage 持久化 | PASS | 刷新页面后重新输入“行”，仍为 hang / hh，计数保持 1 条 |
| 清除修正 | PASS | 点击“清除全部修正”后计数回到 0 条 |
| 控制台 | PASS | 0 条 console error / pageerror |
| 截图 | PASS | `docs/evidence/s1-ui-verify.png`、`s1-keyboard-verify.png`、`s1-readings-verify.png` |

合计 11 项浏览器断言通过。该检查证明页面可交互且修正可持久化，**不等同** G1 人工验收通过；G1 仍需用户按 `TEST_ACCEPTANCE.md` 逐项确认。

尚未执行：真实系统输入法（IME）组合输入、Windows、PWA 安装与断网。以上均为 `NOT_RUN`，不计入通过。

## G1 人工验收

- 状态：`PASS`
- 用户确认：2026-11-02 22:47 回复“通过”。
- 验收对象：S1 验证页（七天课程练习、26 键映射图、多音字修正与 localStorage 持久化）及 `docs/evidence/` 中的三张浏览器截图。
- 自动化前置证据：`npm run typecheck` exit 0；`npm test` 5 文件/84 测试 PASS；`npm run build` exit 0；`npm run verify:ui` 11 项断言 PASS。
- 边界说明：用户未逐项复述操作细节，本报告只记录“已确认通过”这一事实，不替用户补写未执行的具体步骤。
- 下一步：S2 / UI-001（首页、路由与浅色/深色/跟随系统主题）。

## S2 / UI-001 首页、路由与主题

执行日期：2026-11-02（Asia/Shanghai）
被测工件：`npm run build` 产物，`http://127.0.0.1:4174/`
命令：`npm run verify:ui`（`scripts/verify-ui.mjs`，取代 S1 阶段的 `verify-s1-ui.mjs`）

| 检查 | 结果 | 证据 |
|---|---|---|
| 首页统计与冷启动 | PASS | 7 天 / 151 道 / 100 个知识点；“上次学习”为“还没有记录” |
| 首页 → 课时 → 作答 | PASS | 点击“从第 1 天开始”进入 `/lesson/day-1`，韵母 a 判定正确 |
| 浏览器后退 | PASS | `pushState` + `popstate` 正常回退到 `/home`，并显示“上次学习 第 1 天” |
| 课程列表 | PASS | `/course` 列出 7 天 |
| 键位页 | PASS | `/keyboard` 渲染 26 键与 12 行零声母 |
| 深色主题持久化 | PASS | 选择“深色”后 `data-theme=dark`，刷新后仍为深色且下拉保持 |
| 浅色主题 | PASS | 切回浅色后 `data-theme=light`，截图对比正常 |
| 自由训练抽题 | PASS | `seed 1` 抽 20 题；“换一批”到 `seed 2`；难度筛选重置 seed |
| 多音字修正持久化 | PASS | `行 → hang / hh`，刷新后仍生效，可清除 |
| 404 | PASS | `/nope` 显示“没有这个页面”，可返回首页 |
| 控制台 | PASS | 0 条 error / pageerror |
| 截图 | PASS | `s2-home-light.png`、`s2-home-dark.png`、`s2-lesson.png`、`s2-settings.png` |

单元测试新增：路由解析 6 项、主题偏好 4 项、上次学习记录 3 项；全量 `npm test` 7 文件 / 96 测试 PASS，`npm run typecheck` 与 `npm run build` 均 exit 0。

尚未执行：真实系统 IME 组合输入、Windows、PWA 安装/断网、屏幕阅读器实测。

## S2 / UI-002 键盘提示与纠错模式

执行日期：2026-11-02（Asia/Shanghai）
命令：`npm run verify:ui`（18 项断言），`npm test`（8 文件 / 109 测试）

| 检查 | 结果 | 证据 |
|---|---|---|
| 屏幕键盘提示 | PASS | 自动模式首题显示，高亮下一个键 `A` |
| 提示方式持久化 | PASS | 始终显示 / 自动 / 隐藏三档写入 localStorage，切换后练习页生效 |
| 严格纠错锁定 | PASS | 答错后“下一题”禁用，提示“严格纠错已开启” |
| 答错闪正确键 | PASS | 隐藏提示时仍短暂出现键盘并高亮正确键（1.2 秒） |
| 严格纠错解锁 | PASS | 按对 `A` 后“下一题”恢复可用 |
| 自动提示弱化 | PASS | 连对 3 题后第 4 题不再显示键盘；答错重置连对 |
| 连续纠错不阻塞 | PASS | 词句题答错后仍可进入下一题 |
| 速度挑战计时 | PASS | 开始后倒计时到 59 秒；提前结束显示“用时 1 秒 / 正确字数 5 / 正确率 100%” |
| 回归 | PASS | `npm run typecheck`、`npm run build` 均 exit 0；控制台 0 错误 |

单元测试新增：提示方式 4 项、纠错方式 4 项、键盘提示序列 4 项、测速前缀比对 1 项。
速度挑战只统计本次用时与正确字数，CPM 定义、星级与历史记录仍属 S3，未在此处伪造。

尚未执行：真实系统 IME、Windows、PWA 安装/断网。
